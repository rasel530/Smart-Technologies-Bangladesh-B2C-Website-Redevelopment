/**
 * COMPREHENSIVE TEST SCRIPT FOR ALL THREE FIXES
 * 
 * This script tests:
 * 1. Issue #1: Success message when adding product
 * 2. Issue #2: Products displaying on both pages
 * 3. Issue #3: Product image upload
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

// Test results tracking
const testResults = {
  issue1: {
    name: 'Issue #1: Success message when adding product',
    tests: [],
    passed: 0,
    failed: 0
  },
  issue2: {
    name: 'Issue #2: Products displaying on both pages',
    tests: [],
    passed: 0,
    failed: 0
  },
  issue3: {
    name: 'Issue #3: Product image upload',
    tests: [],
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTest(issueNumber, testName, passed, message, details = {}) {
  const result = {
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults[`issue${issueNumber}`].tests.push(result);
  
  if (passed) {
    testResults[`issue${issueNumber}`].passed++;
    console.log(`✅ PASS [Issue #${issueNumber}] ${testName}`);
  } else {
    testResults[`issue${issueNumber}`].failed++;
    console.log(`❌ FAIL [Issue #${issueNumber}] ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
}

// Helper function to create a test image file
function createTestImage(filename = 'test-product.jpg') {
  const testImagePath = path.join(__dirname, filename);
  if (!fs.existsSync(testImagePath)) {
    // Create a simple test image (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0xFF, 0xC0, 0x00,
      0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
      0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00,
      0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
  }
  return testImagePath;
}

// Helper function to get auth token
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smarttech.com',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.token || data.token;
    }
  } catch (error) {
    console.log('Warning: Could not get auth token, some tests may fail');
  }
  return null;
}

// Helper function to get a category ID
async function getCategoryId(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/categories?limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.categories && data.categories.length > 0) {
        return data.categories[0].id;
      }
    }
  } catch (error) {
    console.log('Warning: Could not get category ID');
  }
  return null;
}

// Helper function to get a brand ID
async function getBrandId(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/brands?limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.brands && data.brands.length > 0) {
        return data.brands[0].id;
      }
    }
  } catch (error) {
    console.log('Warning: Could not get brand ID');
  }
  return null;
}

// ============================================
// ISSUE #1: SUCCESS MESSAGE WHEN ADDING PRODUCT
// ============================================
async function testIssue1() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING ISSUE #1: Success message when adding product');
  console.log('='.repeat(70));
  
  const token = await getAuthToken();
  const categoryId = await getCategoryId(token);
  const brandId = await getBrandId(token);
  
  if (!token) {
    logTest(1, 'Authentication', false, 'Could not authenticate', {});
    return;
  }
  
  if (!categoryId || !brandId) {
    logTest(1, 'Prerequisites', false, 'Could not get category or brand ID', { categoryId, brandId });
    return;
  }
  
  // Test 1.1: Create a new product and verify success response
  try {
    const testProduct = {
      sku: `TEST-SKU-${Date.now()}`,
      name: 'Test Product for Issue 1',
      nameEn: 'Test Product for Issue 1',
      slug: `test-product-issue-1-${Date.now()}`,
      shortDescription: 'Test product description',
      description: 'Test product full description',
      categories: [categoryId],
      brandId: brandId,
      regularPrice: 99.99,
      salePrice: 89.99,
      costPrice: 50.00,
      stockQuantity: 100,
      status: 'active',
      visibility: 'public'
    };
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProduct)
    });
    
    const data = await response.json();
    
    if (response.ok && data.message) {
      logTest(1, 'Create product returns success message', true, 
        `Success message received: "${data.message}"`, 
        { message: data.message, productId: data.product?.id });
    } else {
      logTest(1, 'Create product returns success message', false,
        'No success message in response',
        { status: response.status, data });
    }
    
    // Test 1.2: Verify product was actually created
    if (data.product?.id) {
      const getResponse = await fetch(`${API_BASE_URL}/products/${data.product.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        logTest(1, 'Product created successfully', true,
          'Product can be retrieved after creation',
          { productId: data.product.id, productName: getData.product?.name });
      } else {
        logTest(1, 'Product created successfully', false,
          'Product cannot be retrieved after creation',
          { status: getResponse.status });
      }
    }
    
  } catch (error) {
    logTest(1, 'Create product API call', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 1.3: Test error handling - create product with duplicate SKU
  try {
    const duplicateProduct = {
      sku: 'TEST-SKU-DUPLICATE',
      name: 'Test Product Duplicate',
      nameEn: 'Test Product Duplicate',
      slug: 'test-product-duplicate',
      categories: [categoryId],
      brandId: brandId,
      regularPrice: 99.99,
      costPrice: 50.00,
      stockQuantity: 100,
      status: 'active',
      visibility: 'public'
    };
    
    // First creation
    await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(duplicateProduct)
    });
    
    // Second creation with same SKU (should fail)
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(duplicateProduct)
    });
    
    const data = await response.json();
    
    if (!response.ok && (data.error || data.message)) {
      logTest(1, 'Error handling for duplicate SKU', true,
        'Proper error message returned for duplicate SKU',
        { status: response.status, error: data.error || data.message });
    } else {
      logTest(1, 'Error handling for duplicate SKU', false,
        'No proper error message for duplicate SKU',
        { status: response.status, data });
    }
    
  } catch (error) {
    logTest(1, 'Error handling test', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// ISSUE #2: PRODUCTS DISPLAYING ON BOTH PAGES
// ============================================
async function testIssue2() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING ISSUE #2: Products displaying on both pages');
  console.log('='.repeat(70));
  
  // Test 2.1: Fetch products from public products endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/products?limit=20`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest(2, 'Public products API endpoint', true,
        `Successfully fetched ${data.products.length} products`,
        { 
          productsCount: data.products.length,
          pagination: data.pagination 
        });
    } else {
      logTest(2, 'Public products API endpoint', false,
        'Failed to fetch products',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'Public products API endpoint', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.2: Fetch products with filters
  try {
    const response = await fetch(`${API_BASE_URL}/products?status=active&visibility=public&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest(2, 'Products API with filters', true,
        `Successfully fetched ${data.products.length} filtered products`,
        { 
          productsCount: data.products.length,
          filters: { status: 'active', visibility: 'public' }
        });
    } else {
      logTest(2, 'Products API with filters', false,
        'Failed to fetch filtered products',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'Products API with filters', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.3: Test featured products endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest(2, 'Featured products endpoint', true,
        `Successfully fetched ${data.products.length} featured products`,
        { productsCount: data.products.length });
    } else {
      logTest(2, 'Featured products endpoint', false,
        'Failed to fetch featured products',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'Featured products endpoint', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.4: Test new arrivals endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/products/new-arrivals`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest(2, 'New arrivals endpoint', true,
        `Successfully fetched ${data.products.length} new arrival products`,
        { productsCount: data.products.length });
    } else {
      logTest(2, 'New arrivals endpoint', false,
        'Failed to fetch new arrivals',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'New arrivals endpoint', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.5: Test best sellers endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/products/best-sellers`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest(2, 'Best sellers endpoint', true,
        `Successfully fetched ${data.products.length} best seller products`,
        { productsCount: data.products.length });
    } else {
      logTest(2, 'Best sellers endpoint', false,
        'Failed to fetch best sellers',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'Best sellers endpoint', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.6: Test error handling - fetch products with invalid status
  try {
    const response = await fetch(`${API_BASE_URL}/products?status=invalid-status`);
    const data = await response.json();
    
    if (!response.ok && (data.error || data.details)) {
      logTest(2, 'Error handling for invalid filter', true,
        'Proper error returned for invalid filter value',
        { status: response.status, error: data.error, details: data.details });
    } else {
      logTest(2, 'Error handling for invalid filter', false,
        'No proper error for invalid filter value',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(2, 'Error handling test', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.7: Verify environment variables are correct
  try {
    const envPath = path.join(__dirname, '../../frontend/.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const hasBackendApiUrl = envContent.includes('BACKEND_API_URL=http://localhost:3001/api/v1');
      const hasPublicApiUrl = envContent.includes('NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1');
      const hasApiUrl = envContent.includes('NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1');
      
      if (hasBackendApiUrl && hasPublicApiUrl && hasApiUrl) {
        logTest(2, 'Environment variables configuration', true,
          'All required API URLs are correctly configured',
          { 
            BACKEND_API_URL: true,
            NEXT_PUBLIC_BACKEND_API_URL: true,
            NEXT_PUBLIC_API_URL: true
          });
      } else {
        logTest(2, 'Environment variables configuration', false,
          'Some API URLs are missing or incorrect',
          { 
            BACKEND_API_URL: hasBackendApiUrl,
            NEXT_PUBLIC_BACKEND_API_URL: hasPublicApiUrl,
            NEXT_PUBLIC_API_URL: hasApiUrl
          });
      }
    } else {
      logTest(2, 'Environment variables configuration', false,
        '.env file not found',
        { path: envPath });
    }
  } catch (error) {
    logTest(2, 'Environment variables check', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// ISSUE #3: PRODUCT IMAGE UPLOAD
// ============================================
async function testIssue3() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING ISSUE #3: Product image upload');
  console.log('='.repeat(70));
  
  const token = await getAuthToken();
  
  if (!token) {
    logTest(3, 'Authentication', false, 'Could not authenticate', {});
    return;
  }
  
  // Test 3.1: Create a test product first
  let testProductId = null;
  try {
    const categoryId = await getCategoryId(token);
    const brandId = await getBrandId(token);
    
    if (!categoryId || !brandId) {
      logTest(3, 'Prerequisites', false, 'Could not get category or brand ID', {});
      return;
    }
    
    const testProduct = {
      sku: `TEST-IMAGE-${Date.now()}`,
      name: 'Test Product for Image Upload',
      nameEn: 'Test Product for Image Upload',
      slug: `test-product-image-${Date.now()}`,
      categories: [categoryId],
      brandId: brandId,
      regularPrice: 99.99,
      costPrice: 50.00,
      stockQuantity: 100,
      status: 'active',
      visibility: 'public'
    };
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProduct)
    });
    
    const data = await response.json();
    
    if (response.ok && data.product?.id) {
      testProductId = data.product.id;
      logTest(3, 'Create test product for image upload', true,
        'Test product created successfully',
        { productId: testProductId });
    } else {
      logTest(3, 'Create test product for image upload', false,
        'Failed to create test product',
        { status: response.status, data });
      return;
    }
  } catch (error) {
    logTest(3, 'Create test product', false,
      `Error: ${error.message}`,
      { error: error.message });
    return;
  }
  
  // Test 3.2: Upload product image
  try {
    const testImagePath = createTestImage();
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), 'test-product.jpg');
    formData.append('alt', 'Test product image');
    
    const response = await fetch(`${API_BASE_URL}/products/${testProductId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok && data.image) {
      logTest(3, 'Upload product image', true,
        `Image uploaded successfully: ${data.message}`,
        { 
          imageId: data.image.id,
          imageUrl: data.image.url,
          message: data.message
        });
    } else {
      logTest(3, 'Upload product image', false,
        'Failed to upload image',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(3, 'Upload product image', false,
      `Error: ${error.message}`,
      { error: error.message, stack: error.stack });
  }
  
  // Test 3.3: Upload invalid file type
  try {
    const formData = new FormData();
    formData.append('image', Buffer.from('not an image'), 'test.txt');
    
    const response = await fetch(`${API_BASE_URL}/products/${testProductId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok && (data.error || data.message)) {
      logTest(3, 'Reject invalid file type', true,
        'Properly rejected invalid file type',
        { status: response.status, error: data.error || data.message });
    } else {
      logTest(3, 'Reject invalid file type', false,
        'Did not reject invalid file type',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(3, 'Invalid file type test', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.4: Upload image without file
  try {
    const formData = new FormData();
    formData.append('alt', 'Test alt text');
    
    const response = await fetch(`${API_BASE_URL}/products/${testProductId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok && (data.error || data.message)) {
      logTest(3, 'Reject upload without file', true,
        'Properly rejected upload without file',
        { status: response.status, error: data.error || data.message });
    } else {
      logTest(3, 'Reject upload without file', false,
        'Did not reject upload without file',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(3, 'Upload without file test', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.5: Upload image to non-existent product
  try {
    const testImagePath = createTestImage();
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), 'test-product.jpg');
    
    const fakeProductId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(`${API_BASE_URL}/products/${fakeProductId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok && (data.error || data.message)) {
      logTest(3, 'Handle non-existent product', true,
        'Properly handled non-existent product',
        { status: response.status, error: data.error || data.message });
    } else {
      logTest(3, 'Handle non-existent product', false,
        'Did not handle non-existent product properly',
        { status: response.status, data });
    }
  } catch (error) {
    logTest(3, 'Non-existent product test', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.6: Verify comprehensive error handling in backend
  try {
    const productsRoutePath = path.join(__dirname, '../routes/products.js');
    
    if (fs.existsSync(productsRoutePath)) {
      const routeContent = fs.readFileSync(productsRoutePath, 'utf8');
      
      const hasComprehensiveLogging = routeContent.includes('[Product Image Upload]');
      const hasErrorHandling = routeContent.includes('catch (error)');
      const hasCleanup = routeContent.includes('fs.unlinkSync');
      const hasDetailedErrors = routeContent.includes('error.code');
      
      if (hasComprehensiveLogging && hasErrorHandling && hasCleanup && hasDetailedErrors) {
        logTest(3, 'Backend error handling implementation', true,
          'Comprehensive error handling and logging is implemented',
          { 
            comprehensiveLogging: hasComprehensiveLogging,
            errorHandling: hasErrorHandling,
            fileCleanup: hasCleanup,
            detailedErrors: hasDetailedErrors
          });
      } else {
        logTest(3, 'Backend error handling implementation', false,
          'Some error handling features are missing',
          { 
            comprehensiveLogging: hasComprehensiveLogging,
            errorHandling: hasErrorHandling,
            fileCleanup: hasCleanup,
            detailedErrors: hasDetailedErrors
          });
      }
    } else {
      logTest(3, 'Backend error handling implementation', false,
        'Products route file not found',
        { path: productsRoutePath });
    }
  } catch (error) {
    logTest(3, 'Backend error handling check', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// GENERATE TEST REPORT
// ============================================
function generateTestReport() {
  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Test completed at: ${new Date().toISOString()}\n`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (let i = 1; i <= 3; i++) {
    const issue = testResults[`issue${i}`];
    totalPassed += issue.passed;
    totalFailed += issue.failed;
    
    console.log(`${issue.name}`);
    console.log('-'.repeat(70));
    console.log(`Tests Passed: ${issue.passed}`);
    console.log(`Tests Failed: ${issue.failed}`);
    console.log(`Total Tests: ${issue.tests.length}`);
    console.log(`Success Rate: ${((issue.passed / issue.tests.length) * 100).toFixed(2)}%\n`);
    
    issue.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.testName}`);
      if (!test.passed) {
        console.log(`   Message: ${test.message}`);
        if (Object.keys(test.details).length > 0) {
          console.log(`   Details:`, test.details);
        }
      }
    });
    console.log();
  }
  
  console.log('='.repeat(70));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests Passed: ${totalPassed}`);
  console.log(`Total Tests Failed: ${totalFailed}`);
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Overall Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(70));
  
  // Save report to file
  const reportPath = path.join(__dirname, 'test-results-all-three-fixes.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed,
      totalFailed,
      totalTests: totalPassed + totalFailed,
      successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) + '%'
    },
    issues: testResults
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nDetailed test report saved to: ${reportPath}`);
}

// ============================================
// MAIN TEST EXECUTION
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('STARTING COMPREHENSIVE TEST FOR ALL THREE FIXES');
  console.log('='.repeat(70));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Test Start Time: ${new Date().toISOString()}`);
  
  try {
    await testIssue1();
    await testIssue2();
    await testIssue3();
    
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().then(() => {
  console.log('\n' + '='.repeat(70));
  console.log('TEST EXECUTION COMPLETED');
  console.log('='.repeat(70));
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
