const axios = require('axios');
const colors = require('colors');

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 2,
  verbose: true
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
    categoryId: null, // Will be set after creating category
    brandId: null, // Will be set after creating brand
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
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

async function testEndpoint(description, testFn) {
  log(`Testing: ${description}`, 'info');
  
  try {
    const result = await testFn();
    log(`SUCCESS: ${description}`, 'success');
    return { success: true, result };
  } catch (error) {
    const errorMsg = error.response ? 
      `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
      error.message;
    log(`FAILED: ${description} - ${errorMsg}`, 'error');
    return { success: false, error: errorMsg, status: error.response?.status };
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
        createdResources.user = result.data.user;
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
        createdResources.token = result.data.token;
        return result;
      }
    },
    {
      description: 'Refresh token',
      test: () => makeRequest('POST', `${API_VERSION}/auth/refresh`, {
        token: createdResources.token
      })
    },
    {
      description: 'Get user profile',
      test: () => makeRequest('GET', `${API_VERSION}/users/${createdResources.user.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    }
  ],

  // Category tests (require admin access or proper setup)
  categories: [
    {
      description: 'Get all categories',
      test: () => makeRequest('GET', `${API_VERSION}/categories`)
    },
    {
      description: 'Get category tree',
      test: () => makeRequest('GET', `${API_VERSION}/categories/tree/all`)
    },
    {
      description: 'Create category (admin)',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/categories`, TEST_DATA.category, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.category = result.data.category;
        TEST_DATA.product.categoryId = createdResources.category.id;
        return result;
      }
    },
    {
      description: 'Get category by ID',
      test: () => makeRequest('GET', `${API_VERSION}/categories/${createdResources.category.id}`)
    }
  ],

  // Brand tests
  brands: [
    {
      description: 'Get all brands',
      test: () => makeRequest('GET', `${API_VERSION}/brands`)
    },
    {
      description: 'Create brand (admin)',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/brands`, TEST_DATA.brand, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.brand = result.data.brand;
        TEST_DATA.product.brandId = createdResources.brand.id;
        return result;
      }
    },
    {
      description: 'Get brand by ID',
      test: () => makeRequest('GET', `${API_VERSION}/brands/${createdResources.brand.id}`)
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
    },
    {
      description: 'Create product (admin)',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/products`, TEST_DATA.product, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.product = result.data.product;
        return result;
      }
    },
    {
      description: 'Get product by ID',
      test: () => makeRequest('GET', `${API_VERSION}/products/${createdResources.product.id}`)
    },
    {
      description: 'Get product by slug',
      test: () => makeRequest('GET', `${API_VERSION}/products/slug/${createdResources.product.slug}`)
    }
  ],

  // Cart tests
  cart: [
    {
      description: 'Create cart (user)',
      test: async () => {
        // First create a cart for the user
        const result = await makeRequest('POST', `${API_VERSION}/cart`, {
          userId: createdResources.user.id
        }, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.cart = result.data.cart;
        return result;
      }
    },
    {
      description: 'Get cart',
      test: () => makeRequest('GET', `${API_VERSION}/cart/${createdResources.cart.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    },
    {
      description: 'Add item to cart',
      test: () => makeRequest('POST', `${API_VERSION}/cart/${createdResources.cart.id}/items`, {
        productId: createdResources.product.id,
        quantity: 2
      }, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    },
    {
      description: 'Update cart item',
      test: async () => {
        // First get cart items to find an item ID
        const cartResult = await makeRequest('GET', `${API_VERSION}/cart/${createdResources.cart.id}`, null, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        if (cartResult.data.cart.items && cartResult.data.cart.items.length > 0) {
          const itemId = cartResult.data.cart.items[0].id;
          return makeRequest('PUT', `${API_VERSION}/cart/${createdResources.cart.id}/items/${itemId}`, {
            quantity: 3
          }, {
            'Authorization': `Bearer ${createdResources.token}`
          });
        }
        throw new Error('No cart items found to update');
      }
    }
  ],

  // Wishlist tests
  wishlist: [
    {
      description: 'Create wishlist',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/wishlist`, {
          name: 'Test Wishlist'
        }, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.wishlist = result.data.wishlist;
        return result;
      }
    },
    {
      description: 'Get user wishlists',
      test: () => makeRequest('GET', `${API_VERSION}/wishlist/user/${createdResources.user.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    },
    {
      description: 'Add item to wishlist',
      test: () => makeRequest('POST', `${API_VERSION}/wishlist/${createdResources.wishlist.id}/items`, {
        productId: createdResources.product.id
      }, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    },
    {
      description: 'Get wishlist by ID',
      test: () => makeRequest('GET', `${API_VERSION}/wishlist/${createdResources.wishlist.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    }
  ],

  // Coupon tests
  coupons: [
    {
      description: 'Get all coupons',
      test: () => makeRequest('GET', `${API_VERSION}/coupons`)
    },
    {
      description: 'Create coupon (admin)',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/coupons`, TEST_DATA.coupon, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.coupon = result.data.coupon;
        return result;
      }
    },
    {
      description: 'Get coupon by ID',
      test: () => makeRequest('GET', `${API_VERSION}/coupons/${createdResources.coupon.id}`)
    },
    {
      description: 'Get coupon by code',
      test: () => makeRequest('GET', `${API_VERSION}/coupons/code/${createdResources.coupon.code}`)
    }
  ],

  // Review tests
  reviews: [
    {
      description: 'Get all reviews',
      test: () => makeRequest('GET', `${API_VERSION}/reviews`)
    },
    {
      description: 'Create review',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/reviews`, {
          productId: createdResources.product.id,
          rating: 5,
          title: 'Excellent Product',
          comment: 'This is a test review for the product'
        }, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.review = result.data.review;
        return result;
      }
    },
    {
      description: 'Get review by ID',
      test: () => makeRequest('GET', `${API_VERSION}/reviews/${createdResources.review.id}`)
    },
    {
      description: 'Get reviews for product',
      test: () => makeRequest('GET', `${API_VERSION}/reviews?productId=${createdResources.product.id}`)
    }
  ],

  // Order tests
  orders: [
    {
      description: 'Get all orders',
      test: () => makeRequest('GET', `${API_VERSION}/orders`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
    },
    {
      description: 'Create order',
      test: async () => {
        // First create an address for the order
        const addressResult = await makeRequest('POST', `${API_VERSION}/users/${createdResources.user.id}/addresses`, {
          street: '123 Test Street',
          city: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh',
          isDefault: true
        }, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        
        const result = await makeRequest('POST', `${API_VERSION}/orders`, {
          addressId: addressResult.data.address.id,
          items: [{
            productId: createdResources.product.id,
            quantity: 1
          }],
          paymentMethod: 'CASH_ON_DELIVERY'
        }, {
          'Authorization': `Bearer ${createdResources.token}`
        });
        createdResources.order = result.data.order;
        return result;
      }
    },
    {
      description: 'Get order by ID',
      test: () => makeRequest('GET', `${API_VERSION}/orders/${createdResources.order.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      })
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
    test: () => makeRequest('GET', `${API_VERSION}/users/${createdResources.user.id}`)
  },
  {
    description: 'Invalid data validation',
    test: () => makeRequest('POST', `${API_VERSION}/auth/register`, {
      email: 'invalid-email',
      password: '123' // Too short
    })
  }
];

// Main test execution function
async function runTests() {
  console.log('🚀 Starting Comprehensive API Endpoint Testing\n');
  console.log('=' .repeat(60));
  
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
      await new Promise(resolve => setTimeout(resolve, 100));
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
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`.green);
  console.log(`Failed: ${results.failed}`.red);
  console.log(`Skipped: ${results.skipped}`.yellow);
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

// Cleanup function (optional)
async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'info');
  
  try {
    if (createdResources.token && createdResources.order) {
      await makeRequest('DELETE', `${API_VERSION}/orders/${createdResources.order.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.review) {
      await makeRequest('DELETE', `${API_VERSION}/reviews/${createdResources.review.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.wishlist) {
      await makeRequest('DELETE', `${API_VERSION}/wishlist/${createdResources.wishlist.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.coupon) {
      await makeRequest('DELETE', `${API_VERSION}/coupons/${createdResources.coupon.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.product) {
      await makeRequest('DELETE', `${API_VERSION}/products/${createdResources.product.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.brand) {
      await makeRequest('DELETE', `${API_VERSION}/brands/${createdResources.brand.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    if (createdResources.token && createdResources.category) {
      await makeRequest('DELETE', `${API_VERSION}/categories/${createdResources.category.id}`, null, {
        'Authorization': `Bearer ${createdResources.token}`
      });
    }
    
    log('Cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'error');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n✅ All tests completed');
      
      // Ask if user wants to cleanup
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nDo you want to cleanup test data? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          cleanup().then(() => {
            console.log('\n🎉 Testing completed!');
            rl.close();
            process.exit(0);
          });
        } else {
          console.log('\n🎉 Testing completed! (Test data preserved)');
          rl.close();
          process.exit(0);
        }
      });
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  cleanup,
  testSuites,
  TEST_CONFIG,
  TEST_DATA,
  createdResources
};