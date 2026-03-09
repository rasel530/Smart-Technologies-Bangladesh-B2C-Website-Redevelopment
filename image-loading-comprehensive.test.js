/**
 * Comprehensive Image Loading Test Script
 * 
 * This script tests:
 * 1. Backend health and image serving
 * 2. API endpoints for products, categories, and brands
 * 3. Image URL construction
 * 4. Frontend accessibility
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test results storage
const results = {
  backend: { passed: 0, failed: 0, tests: [] },
  api: { passed: 0, failed: 0, tests: [] },
  images: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] }
};

/**
 * Make HTTP request and return status code
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test backend health endpoint
 */
async function testBackendHealth() {
  console.log('\n=== Testing Backend Health ===');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    const passed = response.status === 200;
    
    results.backend.tests.push({
      name: 'Backend Health Endpoint',
      url: `${BACKEND_URL}/health`,
      status: response.status,
      passed
    });

    if (passed) {
      results.backend.passed++;
      console.log('✓ Backend health check: PASSED (200 OK)');
    } else {
      results.backend.failed++;
      console.log(`✗ Backend health check: FAILED (${response.status})`);
    }
  } catch (error) {
    results.backend.failed++;
    results.backend.tests.push({
      name: 'Backend Health Endpoint',
      url: `${BACKEND_URL}/health`,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Backend health check: ERROR - ${error.message}`);
  }
}

/**
 * Test API endpoints and verify image URLs
 */
async function testAPIEndpoints() {
  console.log('\n=== Testing API Endpoints ===');

  // Test Products API
  console.log('\n--- Testing Products API ---');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/products?limit=3`);
    const passed = response.status === 200;
    
    results.api.tests.push({
      name: 'Products API',
      url: `${BACKEND_URL}/api/v1/products`,
      status: response.status,
      passed
    });

    if (passed) {
      results.api.passed++;
      console.log('✓ Products API: PASSED (200 OK)');
      
      // Check image URLs
      try {
        const data = JSON.parse(response.data);
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          if (product.images && product.images.length > 0) {
            const image = product.images[0];
            console.log(`\n  Product: ${product.name}`);
            console.log(`  Image URL: ${image.originalUrl}`);
            
            // Check if URL contains correct path
            const hasCorrectPath = image.originalUrl.includes('/uploads/products/');
            if (hasCorrectPath) {
              console.log(`  ✓ Image URL has correct path: /uploads/products/`);
            } else {
              console.log(`  ✗ Image URL missing correct path: /uploads/products/`);
            }
          }
        }
      } catch (parseError) {
        console.log(`  ⚠ Could not parse response: ${parseError.message}`);
      }
    } else {
      results.api.failed++;
      console.log(`✗ Products API: FAILED (${response.status})`);
    }
  } catch (error) {
    results.api.failed++;
    results.api.tests.push({
      name: 'Products API',
      url: `${BACKEND_URL}/api/v1/products`,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Products API: ERROR - ${error.message}`);
  }

  // Test Categories API
  console.log('\n--- Testing Categories API ---');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/categories?limit=5`);
    const passed = response.status === 200;
    
    results.api.tests.push({
      name: 'Categories API',
      url: `${BACKEND_URL}/api/v1/categories`,
      status: response.status,
      passed
    });

    if (passed) {
      results.api.passed++;
      console.log('✓ Categories API: PASSED (200 OK)');
      
      // Check image URLs
      try {
        const data = JSON.parse(response.data);
        if (data.categories && data.categories.length > 0) {
          const category = data.categories.find(c => c.imageUrl);
          if (category) {
            console.log(`\n  Category: ${category.name}`);
            console.log(`  Image URL: ${category.imageUrl}`);
            
            // Check if URL contains correct path
            const hasCorrectPath = category.imageUrl.includes('/uploads/categories/');
            if (hasCorrectPath) {
              console.log(`  ✓ Image URL has correct path: /uploads/categories/`);
            } else {
              console.log(`  ✗ Image URL missing correct path: /uploads/categories/`);
            }
          }
        }
      } catch (parseError) {
        console.log(`  ⚠ Could not parse response: ${parseError.message}`);
      }
    } else {
      results.api.failed++;
      console.log(`✗ Categories API: FAILED (${response.status})`);
    }
  } catch (error) {
    results.api.failed++;
    results.api.tests.push({
      name: 'Categories API',
      url: `${BACKEND_URL}/api/v1/categories`,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Categories API: ERROR - ${error.message}`);
  }

  // Test Brands API
  console.log('\n--- Testing Brands API ---');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/brands?limit=5`);
    const passed = response.status === 200;
    
    results.api.tests.push({
      name: 'Brands API',
      url: `${BACKEND_URL}/api/v1/brands`,
      status: response.status,
      passed
    });

    if (passed) {
      results.api.passed++;
      console.log('✓ Brands API: PASSED (200 OK)');
      
      // Check logo URLs
      try {
        const data = JSON.parse(response.data);
        if (data.brands && data.brands.length > 0) {
          const brand = data.brands.find(b => b.logoUrl);
          if (brand) {
            console.log(`\n  Brand: ${brand.name}`);
            console.log(`  Logo URL: ${brand.logoUrl}`);
            
            // Check if URL contains correct path
            const hasCorrectPath = brand.logoUrl.includes('/uploads/brands/');
            if (hasCorrectPath) {
              console.log(`  ✓ Logo URL has correct path: /uploads/brands/`);
            } else {
              console.log(`  ✗ Logo URL missing correct path: /uploads/brands/`);
            }
          }
        }
      } catch (parseError) {
        console.log(`  ⚠ Could not parse response: ${parseError.message}`);
      }
    } else {
      results.api.failed++;
      console.log(`✗ Brands API: FAILED (${response.status})`);
    }
  } catch (error) {
    results.api.failed++;
    results.api.tests.push({
      name: 'Brands API',
      url: `${BACKEND_URL}/api/v1/brands`,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Brands API: ERROR - ${error.message}`);
  }
}

/**
 * Test direct image access
 */
async function testDirectImageAccess() {
  console.log('\n=== Testing Direct Image Access ===');

  // Test product image
  console.log('\n--- Testing Product Image ---');
  const productImageUrl = `${BACKEND_URL}/uploads/products/0eaf0abf-fffd-4a15-99e4-793887219687/1771343535625_800845154_0_Lenovo-IdeaPad-Slim-3-14ARP10-Luna-Grey_medium.jpg`;
  try {
    const response = await makeRequest(productImageUrl);
    const passed = response.status === 200;
    
    results.images.tests.push({
      name: 'Product Image',
      url: productImageUrl,
      status: response.status,
      contentType: response.headers['content-type'],
      passed
    });

    if (passed) {
      results.images.passed++;
      console.log(`✓ Product Image: PASSED (200 OK)`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);
    } else {
      results.images.failed++;
      console.log(`✗ Product Image: FAILED (${response.status})`);
    }
  } catch (error) {
    results.images.failed++;
    results.images.tests.push({
      name: 'Product Image',
      url: productImageUrl,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Product Image: ERROR - ${error.message}`);
  }

  // Test category image
  console.log('\n--- Testing Category Image ---');
  const categoryImageUrl = `${BACKEND_URL}/uploads/categories/category-1770456980876-789045081.jpg`;
  try {
    const response = await makeRequest(categoryImageUrl);
    const passed = response.status === 200;
    
    results.images.tests.push({
      name: 'Category Image',
      url: categoryImageUrl,
      status: response.status,
      contentType: response.headers['content-type'],
      passed
    });

    if (passed) {
      results.images.passed++;
      console.log(`✓ Category Image: PASSED (200 OK)`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);
    } else {
      results.images.failed++;
      console.log(`✗ Category Image: FAILED (${response.status})`);
    }
  } catch (error) {
    results.images.failed++;
    results.images.tests.push({
      name: 'Category Image',
      url: categoryImageUrl,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Category Image: ERROR - ${error.message}`);
  }

  // Test brand logo
  console.log('\n--- Testing Brand Logo ---');
  const brandLogoUrl = `${BACKEND_URL}/uploads/brands/brand-1770459032722-637104035.jpg`;
  try {
    const response = await makeRequest(brandLogoUrl);
    const passed = response.status === 200;
    
    results.images.tests.push({
      name: 'Brand Logo',
      url: brandLogoUrl,
      status: response.status,
      contentType: response.headers['content-type'],
      passed
    });

    if (passed) {
      results.images.passed++;
      console.log(`✓ Brand Logo: PASSED (200 OK)`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);
    } else {
      results.images.failed++;
      console.log(`✗ Brand Logo: FAILED (${response.status})`);
    }
  } catch (error) {
    results.images.failed++;
    results.images.tests.push({
      name: 'Brand Logo',
      url: brandLogoUrl,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Brand Logo: ERROR - ${error.message}`);
  }
}

/**
 * Test frontend accessibility
 */
async function testFrontend() {
  console.log('\n=== Testing Frontend ===');

  // Test home page
  console.log('\n--- Testing Home Page ---');
  try {
    const response = await makeRequest(FRONTEND_URL);
    const passed = response.status === 200;
    
    results.frontend.tests.push({
      name: 'Home Page',
      url: FRONTEND_URL,
      status: response.status,
      passed
    });

    if (passed) {
      results.frontend.passed++;
      console.log(`✓ Home Page: PASSED (200 OK)`);
    } else {
      results.frontend.failed++;
      console.log(`✗ Home Page: FAILED (${response.status})`);
    }
  } catch (error) {
    results.frontend.failed++;
    results.frontend.tests.push({
      name: 'Home Page',
      url: FRONTEND_URL,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Home Page: ERROR - ${error.message}`);
  }

  // Test categories page
  console.log('\n--- Testing Categories Page ---');
  try {
    const response = await makeRequest(`${FRONTEND_URL}/categories/laptops`);
    const passed = response.status === 200;
    
    results.frontend.tests.push({
      name: 'Categories Page',
      url: `${FRONTEND_URL}/categories/laptops`,
      status: response.status,
      passed
    });

    if (passed) {
      results.frontend.passed++;
      console.log(`✓ Categories Page: PASSED (200 OK)`);
    } else {
      results.frontend.failed++;
      console.log(`✗ Categories Page: FAILED (${response.status})`);
    }
  } catch (error) {
    results.frontend.failed++;
    results.frontend.tests.push({
      name: 'Categories Page',
      url: `${FRONTEND_URL}/categories/laptops`,
      status: 'ERROR',
      passed: false,
      error: error.message
    });
    console.log(`✗ Categories Page: ERROR - ${error.message}`);
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  console.log('Backend Tests:');
  console.log(`  Passed: ${results.backend.passed}`);
  console.log(`  Failed: ${results.backend.failed}`);
  console.log(`  Total:  ${results.backend.passed + results.backend.failed}\n`);

  console.log('API Tests:');
  console.log(`  Passed: ${results.api.passed}`);
  console.log(`  Failed: ${results.api.failed}`);
  console.log(`  Total:  ${results.api.passed + results.api.failed}\n`);

  console.log('Image Tests:');
  console.log(`  Passed: ${results.images.passed}`);
  console.log(`  Failed: ${results.images.failed}`);
  console.log(`  Total:  ${results.images.passed + results.images.failed}\n`);

  console.log('Frontend Tests:');
  console.log(`  Passed: ${results.frontend.passed}`);
  console.log(`  Failed: ${results.frontend.failed}`);
  console.log(`  Total:  ${results.frontend.passed + results.frontend.failed}\n`);

  const totalPassed = results.backend.passed + results.api.passed + results.images.passed + results.frontend.passed;
  const totalFailed = results.backend.failed + results.api.failed + results.images.failed + results.frontend.failed;
  const totalTests = totalPassed + totalFailed;

  console.log('========================================');
  console.log('TOTAL');
  console.log('========================================');
  console.log(`  Passed: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
  console.log(`  Failed: ${totalFailed}/${totalTests} (${((totalFailed/totalTests)*100).toFixed(1)}%)\n`);

  if (totalFailed === 0) {
    console.log('✓ ALL TESTS PASSED!');
  } else {
    console.log('✗ SOME TESTS FAILED');
    console.log('\nFailed Tests:');
    [...results.backend.tests, ...results.api.tests, ...results.images.tests, ...results.frontend.tests]
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.status} ${test.error ? `(${test.error})` : ''}`);
      });
  }

  console.log('\n========================================\n');
}

/**
 * Main function
 */
async function main() {
  console.log('========================================');
  console.log('COMPREHENSIVE IMAGE LOADING TEST');
  console.log('========================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}`);

  await testBackendHealth();
  await testAPIEndpoints();
  await testDirectImageAccess();
  await testFrontend();
  
  printSummary();
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
