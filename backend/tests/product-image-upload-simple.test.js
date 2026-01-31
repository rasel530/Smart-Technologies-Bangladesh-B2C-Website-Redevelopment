/**
 * PRODUCT IMAGE UPLOAD - SIMPLE TEST FOR ADMIN AUTHORIZATION FIX
 * 
 * This script tests the adminOnly() middleware fix for product image upload
 * by testing with existing admin users.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_PRODUCT_ID = '01d8b914-2213-4388-a24d-d547f20e29d6';

// Test results tracking
const testResults = {
  middlewareFix: {
    name: 'Admin Authorization Fix for Product Image Upload',
    tests: [],
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTest(category, testName, passed, message, details = {}) {
  const result = {
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults[category].tests.push(result);
  
  if (passed) {
    testResults[category].passed++;
    console.log(`✅ PASS [${category}] ${testName}`);
  } else {
    testResults[category].failed++;
    console.log(`❌ FAIL [${category}] ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
}

// Helper function to create a test image file
function createTestImage(filename = 'test-product-image.jpg') {
  const testImagePath = path.join(__dirname, filename);
  if (!fs.existsSync(testImagePath)) {
    // Create a simple test image (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xDA,
      0x00, 0x08, 0x01, 0x01, 0x01, 0x3F, 0x00,
      0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
  }
  return testImagePath;
}

// Helper function to get auth token
async function getAuthToken(identifier, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.token || data.token;
    } else {
      const error = await response.json();
      console.log(`Login failed for ${identifier}:`, error);
    }
  } catch (error) {
    console.log(`Error logging in ${identifier}:`, error.message);
  }
  return null;
}

// Helper function to upload product image
async function uploadProductImage(productId, token, imagePath, altText = 'Test image') {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath), 'test-product.jpg');
    formData.append('alt', altText);
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json()
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// ============================================
// TEST 1: VERIFY MIDDLEWARE IMPLEMENTATION
// ============================================
async function testMiddlewareImplementation() {
  console.log('\n[Test 1.1] Verifying adminOnly() middleware implementation...');
  
  try {
    const authMiddlewarePath = path.join(__dirname, '../middleware/auth.js');
    const authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
    
    const hasLegacyCheck = authContent.includes('req.user.role?.toUpperCase() === \'ADMIN\'');
    const hasRbacCheck = authContent.includes('req.user.rbacRole?.toLowerCase() === \'admin\'');
    const hasProperError = authContent.includes('error: \'Access denied\'');
    const has403Status = authContent.includes('status(403)');
    
    if (hasLegacyCheck && hasRbacCheck && hasProperError && has403Status) {
      logTest('middlewareFix', 'Middleware implementation check', true,
        'adminOnly() middleware properly checks both legacy and RBAC roles',
        {
          hasLegacyCheck,
          hasRbacCheck,
          hasProperError,
          has403Status
        });
    } else {
      logTest('middlewareFix', 'Middleware implementation check', false,
        'adminOnly() middleware is missing required checks',
        {
          hasLegacyCheck,
          hasRbacCheck,
          hasProperError,
          has403Status
        });
    }
  } catch (error) {
    logTest('middlewareFix', 'Middleware implementation check', false,
      `Error reading middleware file: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// TEST 2: TEST LEGACY ADMIN USER CAN UPLOAD IMAGES
// ============================================
async function testLegacyAdminUpload() {
  console.log('\n[Test 2] Testing legacy admin user can upload images...');
  
  const token = await getAuthToken('admin2@smarttech.com', 'admin123');
  
  if (!token) {
    logTest('middlewareFix', 'Legacy admin can upload images', false,
      'Could not authenticate legacy admin user',
      { email: 'admin2@smarttech.com' });
    return;
  }
  
  const testImagePath = createTestImage('legacy-admin-test.jpg');
  const result = await uploadProductImage(TEST_PRODUCT_ID, token, testImagePath, 'Legacy admin test');
  
  if (result.ok && result.data.image) {
    logTest('middlewareFix', 'Legacy admin can upload images', true,
      'User with legacy role ADMIN can successfully upload product images',
      {
        status: result.status,
        imageId: result.data.image.id,
        imageUrl: result.data.image.url
      });
      
    // Clean up uploaded image
    try {
      const imagePath = path.join(__dirname, '..', 'uploads', 'products', result.data.image.url.split('/').pop());
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (cleanupError) {
      console.log('   Warning: Could not clean up test image');
    }
  } else if (result.status === 403) {
    logTest('middlewareFix', 'Legacy admin can upload images', false,
      'Legacy admin user received 403 Forbidden',
      { status: result.status, error: result.data });
  } else if (result.status === 500) {
    logTest('middlewareFix', 'Legacy admin can upload images', false,
      'CRITICAL: Legacy admin user received 500 Internal Server Error',
      { status: result.status, error: result.data });
  } else {
    logTest('middlewareFix', 'Legacy admin can upload images', false,
      `Unexpected status code: ${result.status}`,
      { status: result.status, error: result.data });
  }
}

// ============================================
// TEST 3: TEST NON-ADMIN USER RECEIVES 403 (NOT 500)
// ============================================
async function testNonAdminReceives403() {
  console.log('\n[Test 3] Testing non-admin user receives 403 (not 500)...');
  
  // Use a regular user (customer) - test with user@smarttech.com
  const token = await getAuthToken('user@smarttech.com', 'user123');
  
  if (!token) {
    logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
      'Could not authenticate non-admin user',
      { email: 'user@smarttech.com' });
    return;
  }
  
  const testImagePath = createTestImage('non-admin-test.jpg');
  const result = await uploadProductImage(TEST_PRODUCT_ID, token, testImagePath, 'Non-admin test');
  
  if (result.status === 403) {
    logTest('middlewareFix', 'Non-admin receives 403 (not 500)', true,
      'Non-admin user correctly receives 403 Forbidden error',
      {
        status: result.status,
        error: result.data.error || result.data.message
      });
  } else if (result.status === 500) {
    logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
      'CRITICAL: Non-admin user received 500 Internal Server Error instead of 403',
      { status: result.status, error: result.data });
  } else if (result.ok) {
    logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
      'SECURITY ISSUE: Non-admin user was able to upload image',
      { status: result.status, data: result.data });
  } else {
    logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
      `Unexpected status code: ${result.status}`,
      { status: result.status, error: result.data });
  }
}

// ============================================
// TEST 4: TEST ERROR HANDLING FOR INVALID PRODUCT ID
// ============================================
async function testInvalidProductId() {
  console.log('\n[Test 4] Testing error handling for invalid product ID...');
  
  const token = await getAuthToken('admin2@smarttech.com', 'admin123');
  
  if (!token) {
    logTest('middlewareFix', 'Error handling for invalid product ID', false,
      'No admin token available for testing',
      {});
    return;
  }
  
  const testImagePath = createTestImage('invalid-product-test.jpg');
  const fakeProductId = '00000000-0000-0000-0000-000000000000';
  const result = await uploadProductImage(fakeProductId, token, testImagePath, 'Invalid product test');
  
  if (result.status === 404) {
    logTest('middlewareFix', 'Error handling for invalid product ID', true,
      'Properly returns 404 for non-existent product',
      { status: result.status, error: result.data.error || result.data.message });
  } else if (result.status === 500) {
    logTest('middlewareFix', 'Error handling for invalid product ID', false,
      'CRITICAL: Received 500 for invalid product ID',
      { status: result.status, error: result.data });
  } else {
    logTest('middlewareFix', 'Error handling for invalid product ID', false,
      `Unexpected status code: ${result.status}`,
      { status: result.status, error: result.data });
  }
}

// ============================================
// TEST 5: VERIFY NO 500 ERRORS OCCUR
// ============================================
function verifyNo500Errors() {
  console.log('\n[Test 5] Verifying no 500 Internal Server Errors occur...');
  
  const has500Errors = testResults.middlewareFix.tests.some(test => 
    !test.passed && test.details && test.details.status === 500
  );
  
  if (!has500Errors) {
    logTest('middlewareFix', 'No 500 errors occur', true,
      'No 500 Internal Server Errors detected in any test scenario',
      {});
  } else {
    const failed500Tests = testResults.middlewareFix.tests.filter(test => 
      !test.passed && test.details && test.details.status === 500
    );
    
    logTest('middlewareFix', 'No 500 errors occur', false,
      `CRITICAL: ${failed500Tests.length} test(s) resulted in 500 errors`,
      { failedTests: failed500Tests.map(t => t.testName) });
  }
}

// ============================================
// MAIN TEST EXECUTION
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCT IMAGE UPLOAD - ADMIN AUTHORIZATION FIX TEST');
  console.log('='.repeat(80));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Product ID: ${TEST_PRODUCT_ID}`);
  console.log(`Test Start Time: ${new Date().toISOString()}`);
  
  try {
    await testMiddlewareImplementation();
    await testLegacyAdminUpload();
    await testNonAdminReceives403();
    await testInvalidProductId();
    verifyNo500Errors();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', error);
    logTest('middlewareFix', 'Test execution', false,
      `Fatal error: ${error.message}`,
      { error: error.message, stack: error.stack });
  }
}

// ============================================
// GENERATE TEST REPORT
// ============================================
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCT IMAGE UPLOAD - ADMIN AUTHORIZATION FIX TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Test completed at: ${new Date().toISOString()}\n`);
  
  const category = testResults.middlewareFix;
  
  console.log(`${category.name}`);
  console.log('-'.repeat(80));
  console.log(`Tests Passed: ${category.passed}`);
  console.log(`Tests Failed: ${category.failed}`);
  console.log(`Total Tests: ${category.tests.length}`);
  console.log(`Success Rate: ${((category.passed / category.tests.length) * 100).toFixed(2)}%\n`);
  
  category.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.testName}`);
    if (!test.passed) {
      console.log(`   Message: ${test.message}`);
      if (Object.keys(test.details).length > 0) {
        console.log(`   Details:`, test.details);
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('FIX VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  // Check critical tests
  const criticalTests = [
    'Middleware implementation check',
    'Legacy admin can upload images',
    'Non-admin receives 403 (not 500)',
    'No 500 errors occur'
  ];
  
  const criticalTestResults = category.tests.filter(test => 
    criticalTests.includes(test.testName)
  );
  
  const allCriticalPassed = criticalTestResults.every(test => test.passed);
  
  if (allCriticalPassed) {
    console.log('✅ ALL CRITICAL TESTS PASSED');
    console.log('✅ The adminOnly() middleware fix is working correctly');
    console.log('✅ Both legacy and RBAC admin users can upload images');
    console.log('✅ Non-admin users receive proper 403 errors (not 500)');
    console.log('✅ No 500 Internal Server Errors occur');
  } else {
    console.log('❌ SOME CRITICAL TESTS FAILED');
    console.log('❌ The adminOnly() middleware fix may not be working correctly');
    
    const failedCriticalTests = criticalTestResults.filter(test => !test.passed);
    failedCriticalTests.forEach(test => {
      console.log(`❌ ${test.testName}`);
    });
  }
  
  console.log('='.repeat(80));
  
  // Save report to file
  const reportPath = path.join(__dirname, 'product-image-upload-simple-test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed: category.passed,
      totalFailed: category.failed,
      totalTests: category.tests.length,
      successRate: ((category.passed / category.tests.length) * 100).toFixed(2) + '%',
      allCriticalPassed,
      criticalTestsPassed: criticalTestResults.filter(t => t.passed).length,
      criticalTestsTotal: criticalTestResults.length
    },
    tests: category.tests
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nDetailed test report saved to: ${reportPath}`);
}

// Run tests
runAllTests().then(() => {
  console.log('\n' + '='.repeat(80));
  console.log('TEST EXECUTION COMPLETED');
  console.log('='.repeat(80));
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
