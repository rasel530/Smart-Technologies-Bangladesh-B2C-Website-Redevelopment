/**
 * Comprehensive Verification Test for Image Deletion Fix
 * 
 * This script tests the CORRECTED frontend API URLs for image operations:
 * - DELETE /api/v1/images/{imageId} (NOT /products/{imageId})
 * - PUT /api/v1/images/{imageId} (NOT /products/{imageId})
 * - POST /api/v1/images/{imageId}/primary (NOT /products/{imageId}/primary)
 * - GET /api/v1/images/{imageId}/versions (NOT /products/{imageId}/versions)
 * 
 * Background:
 * - Backend routes are mounted at /api/v1/images (backend/index.js:399)
 * - Frontend uses /images/{imageId} URLs (frontend/src/lib/api/product-images.ts)
 * - Previous test used WRONG URLs (/api/v1/products/{imageId}) causing 404 errors
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_URL = new URL(API_BASE_URL);

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test case recorder
function recordTest(testName, passed, details, error = null) {
  const result = {
    testName,
    status: passed ? 'PASS' : 'FAIL',
    timestamp: new Date().toISOString(),
    details,
    error: error ? error.message : null,
    stack: error ? error.stack : null
  };

  testResults.tests.push(result);
  testResults.summary.total++;

  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Details:`, details);
    if (error) {
      console.log(`   Error:`, error.message);
    }
  }
}

// Test case recorder with skip
function skipTest(testName, reason) {
  const result = {
    testName,
    status: 'SKIP',
    timestamp: new Date().toISOString(),
    details: { reason }
  };

  testResults.tests.push(result);
  testResults.summary.total++;
  testResults.summary.skipped++;
  console.log(`⏭️  SKIP: ${testName} - ${reason}`);
}

// Main test function
async function runTests() {
  console.log('\n========================================');
  console.log('Image Deletion Fix Verification Test');
  console.log('========================================\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Started: ${new Date().toISOString()}\n`);

  let authToken = null;
  let testProductId = null;
  let testImageId = null;

  try {
    // ============================================
    // Test 1: Server Health Check
    // ============================================
    console.log('\n--- Test 1: Server Health Check ---');
    try {
      const healthResponse = await makeRequest('GET', '/health');
      recordTest(
        'Server Health Check',
        healthResponse.statusCode === 200,
        {
          statusCode: healthResponse.statusCode,
          response: healthResponse.body
        }
      );
    } catch (error) {
      recordTest('Server Health Check', false, { error: 'Connection failed' }, error);
    }

    // ============================================
    // Test 2: Admin Login
    // ============================================
    console.log('\n--- Test 2: Admin Login ---');
    try {
      const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {
        identifier: process.env.ADMIN_IDENTIFIER || 'admin@smarttech.com',
        password: process.env.ADMIN_PASSWORD || 'AdminPassword123'
      });

      if (loginResponse.statusCode === 200 && loginResponse.body && loginResponse.body.token) {
        authToken = loginResponse.body.token;
        recordTest(
          'Admin Login',
          true,
          {
            statusCode: loginResponse.statusCode,
            hasToken: !!authToken
          }
        );
      } else {
        recordTest(
          'Admin Login',
          false,
          {
            statusCode: loginResponse.statusCode,
            response: loginResponse.body
          }
        );
        throw new Error('Failed to login as admin');
      }
    } catch (error) {
      recordTest('Admin Login', false, { error: 'Login request failed' }, error);
      throw error;
    }

    // ============================================
    // Test 3: Get Products List
    // ============================================
    console.log('\n--- Test 3: Get Products List ---');
    try {
      const productsResponse = await makeRequest('GET', '/api/v1/products?limit=10');
      
      if (productsResponse.statusCode === 200 && 
          productsResponse.body && 
          productsResponse.body.products && 
          productsResponse.body.products.length > 0) {
        
        // Find a product with images
        const productWithImages = productsResponse.body.products.find(p => 
          p.images && p.images.length > 0
        );

        if (productWithImages) {
          testProductId = productWithImages.id;
          testImageId = productWithImages.images[0].id;
          
          recordTest(
            'Get Products List (with images)',
            true,
            {
              statusCode: productsResponse.statusCode,
              totalProducts: productsResponse.body.products.length,
              selectedProductId: testProductId,
              selectedImageId: testImageId,
              imageCount: productWithImages.images.length
            }
          );
        } else {
          recordTest(
            'Get Products List (with images)',
            false,
            {
              statusCode: productsResponse.statusCode,
              totalProducts: productsResponse.body.products.length,
              error: 'No products with images found'
            }
          );
          skipTest('Image Deletion Tests', 'No test image available');
          skipTest('Update Image Metadata', 'No test image available');
          skipTest('Set Primary Image', 'No test image available');
          skipTest('Get Image Versions', 'No test image available');
        }
      } else {
        recordTest(
          'Get Products List',
          false,
          {
            statusCode: productsResponse.statusCode,
            response: productsResponse.body
          }
        );
        skipTest('Image Deletion Tests', 'No products available');
        skipTest('Update Image Metadata', 'No products available');
        skipTest('Set Primary Image', 'No products available');
        skipTest('Get Image Versions', 'No products available');
      }
    } catch (error) {
      recordTest('Get Products List', false, { error: 'Request failed' }, error);
      skipTest('Image Deletion Tests', 'Failed to get products');
      skipTest('Update Image Metadata', 'Failed to get products');
      skipTest('Set Primary Image', 'Failed to get products');
      skipTest('Get Image Versions', 'Failed to get products');
    }

    // Only proceed if we have a test image
    if (!testImageId || !authToken) {
      console.log('\n⚠️  Cannot proceed with image operation tests - missing prerequisites');
      return;
    }

    // ============================================
    // Test 4: Get Product Images (Baseline)
    // ============================================
    console.log('\n--- Test 4: Get Product Images (Baseline) ---');
    try {
      const imagesResponse = await makeRequest(
        'GET',
        `/api/v1/products/${testProductId}/images`
      );

      recordTest(
        'Get Product Images (Baseline)',
        imagesResponse.statusCode === 200,
        {
          statusCode: imagesResponse.statusCode,
          imageCount: imagesResponse.body?.images?.length || 0
        }
      );
    } catch (error) {
      recordTest('Get Product Images (Baseline)', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 5: Update Image Metadata (CORRECTED URL: /images/{id})
    // ============================================
    console.log('\n--- Test 5: Update Image Metadata (CORRECTED URL) ---');
    console.log(`Testing: PUT /api/v1/images/${testImageId}`);
    try {
      const updateResponse = await makeRequest(
        'PUT',
        `/api/v1/images/${testImageId}`,
        {
          altTextEn: `Updated alt text ${Date.now()}`,
          altTextBn: `আপডেট করা অল্ট টেক্সট ${Date.now()}`,
          displayOrder: 0
        },
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (updateResponse.statusCode === 200 || updateResponse.statusCode === 204) {
        recordTest(
          'Update Image Metadata (CORRECTED URL: /images/{id})',
          true,
          {
            statusCode: updateResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            response: updateResponse.body
          }
        );
      } else if (updateResponse.statusCode === 404) {
        recordTest(
          'Update Image Metadata (CORRECTED URL: /images/{id})',
          false,
          {
            statusCode: updateResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            error: '404 Not Found - Route may not be properly mounted',
            response: updateResponse.body
          }
        );
      } else {
        recordTest(
          'Update Image Metadata (CORRECTED URL: /images/{id})',
          false,
          {
            statusCode: updateResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            response: updateResponse.body
          }
        );
      }
    } catch (error) {
      recordTest('Update Image Metadata (CORRECTED URL)', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 6: Get Image Versions (CORRECTED URL: /images/{id}/versions)
    // ============================================
    console.log('\n--- Test 6: Get Image Versions (CORRECTED URL) ---');
    console.log(`Testing: GET /api/v1/images/${testImageId}/versions`);
    try {
      const versionsResponse = await makeRequest(
        'GET',
        `/api/v1/images/${testImageId}/versions`,
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (versionsResponse.statusCode === 200) {
        recordTest(
          'Get Image Versions (CORRECTED URL: /images/{id}/versions)',
          true,
          {
            statusCode: versionsResponse.statusCode,
            url: `/api/v1/images/${testImageId}/versions`,
            hasVariants: versionsResponse.body?.variants?.length > 0,
            variantCount: versionsResponse.body?.variants?.length || 0
          }
        );
      } else if (versionsResponse.statusCode === 404) {
        recordTest(
          'Get Image Versions (CORRECTED URL: /images/{id}/versions)',
          false,
          {
            statusCode: versionsResponse.statusCode,
            url: `/api/v1/images/${testImageId}/versions`,
            error: '404 Not Found - Route may not be properly mounted',
            response: versionsResponse.body
          }
        );
      } else {
        recordTest(
          'Get Image Versions (CORRECTED URL: /images/{id}/versions)',
          false,
          {
            statusCode: versionsResponse.statusCode,
            url: `/api/v1/images/${testImageId}/versions`,
            response: versionsResponse.body
          }
        );
      }
    } catch (error) {
      recordTest('Get Image Versions (CORRECTED URL)', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 7: Set Primary Image (CORRECTED URL: /images/{id}/primary)
    // ============================================
    console.log('\n--- Test 7: Set Primary Image (CORRECTED URL) ---');
    console.log(`Testing: POST /api/v1/images/${testImageId}/primary`);
    try {
      const primaryResponse = await makeRequest(
        'POST',
        `/api/v1/images/${testImageId}/primary`,
        {},
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (primaryResponse.statusCode === 200 || primaryResponse.statusCode === 204) {
        recordTest(
          'Set Primary Image (CORRECTED URL: /images/{id}/primary)',
          true,
          {
            statusCode: primaryResponse.statusCode,
            url: `/api/v1/images/${testImageId}/primary`,
            response: primaryResponse.body
          }
        );
      } else if (primaryResponse.statusCode === 404) {
        recordTest(
          'Set Primary Image (CORRECTED URL: /images/{id}/primary)',
          false,
          {
            statusCode: primaryResponse.statusCode,
            url: `/api/v1/images/${testImageId}/primary`,
            error: '404 Not Found - Route may not be properly mounted',
            response: primaryResponse.body
          }
        );
      } else {
        recordTest(
          'Set Primary Image (CORRECTED URL: /images/{id}/primary)',
          false,
          {
            statusCode: primaryResponse.statusCode,
            url: `/api/v1/images/${testImageId}/primary`,
            response: primaryResponse.body
          }
        );
      }
    } catch (error) {
      recordTest('Set Primary Image (CORRECTED URL)', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 8: Delete Image (CORRECTED URL: /images/{id}) - MAIN TEST
    // ============================================
    console.log('\n--- Test 8: Delete Image (CORRECTED URL) - MAIN TEST ---');
    console.log(`Testing: DELETE /api/v1/images/${testImageId}`);
    console.log('This is the PRIMARY test for image deletion fix\n');

    try {
      const deleteResponse = await makeRequest(
        'DELETE',
        `/api/v1/images/${testImageId}`,
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (deleteResponse.statusCode === 200 || deleteResponse.statusCode === 204) {
        recordTest(
          'Delete Image (CORRECTED URL: /images/{id}) - MAIN TEST',
          true,
          {
            statusCode: deleteResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            deletedImageId: testImageId,
            response: deleteResponse.body,
            message: '✅ 404 error RESOLVED - Image deleted successfully'
          }
        );
      } else if (deleteResponse.statusCode === 404) {
        recordTest(
          'Delete Image (CORRECTED URL: /images/{id}) - MAIN TEST',
          false,
          {
            statusCode: deleteResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            error: '❌ 404 Not Found - URL mismatch still exists',
            response: deleteResponse.body,
            message: 'Fix did not resolve 404 error'
          }
        );
      } else {
        recordTest(
          'Delete Image (CORRECTED URL: /images/{id}) - MAIN TEST',
          false,
          {
            statusCode: deleteResponse.statusCode,
            url: `/api/v1/images/${testImageId}`,
            response: deleteResponse.body
          }
        );
      }
    } catch (error) {
      recordTest('Delete Image (CORRECTED URL) - MAIN TEST', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 9: Verify Image Deleted from Database
    // ============================================
    console.log('\n--- Test 9: Verify Image Deleted from Database ---');
    try {
      const verifyResponse = await makeRequest(
        'GET',
        `/api/v1/products/${testProductId}/images`
      );

      const imageStillExists = verifyResponse.body?.images?.some(img => img.id === testImageId);

      recordTest(
        'Verify Image Deleted from Database',
        !imageStillExists,
        {
          statusCode: verifyResponse.statusCode,
          imageExists: imageStillExists,
          remainingImages: verifyResponse.body?.images?.length || 0
        }
      );
    } catch (error) {
      recordTest('Verify Image Deleted from Database', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 10: Test Authentication Required
    // ============================================
    console.log('\n--- Test 10: Test Authentication Required ---');
    try {
      // Get another image ID to test with (since testImageId is deleted)
      const productsResponse = await makeRequest('GET', '/api/v1/products?limit=10');
      let anotherImageId = null;
      if (productsResponse.statusCode === 200 && productsResponse.body?.products?.length > 0) {
        const productWithImages = productsResponse.body.products.find(p => 
          p.images && p.images.length > 1
        );
        if (productWithImages && productWithImages.images.length > 1) {
          anotherImageId = productWithImages.images[1].id;
        }
      }

      if (anotherImageId) {
        // Test DELETE without auth
        const deleteNoAuthResponse = await makeRequest(
          'DELETE',
          `/api/v1/images/${anotherImageId}`,
          null
        );

        recordTest(
          'Authentication Required for Delete',
          deleteNoAuthResponse.statusCode === 401 || deleteNoAuthResponse.statusCode === 403,
          {
            statusCode: deleteNoAuthResponse.statusCode,
            requiresAuth: deleteNoAuthResponse.statusCode === 401 || deleteNoAuthResponse.statusCode === 403
          }
        );
      } else {
        skipTest('Authentication Required for Delete', 'No additional image available for testing');
      }
    } catch (error) {
      recordTest('Authentication Required for Delete', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 11: Test Authorization (Non-Admin)
    // ============================================
    console.log('\n--- Test 11: Test Authorization (Non-Admin) ---');
    try {
      // First, login as regular user
      const userLoginResponse = await makeRequest('POST', '/api/v1/auth/login', {
        identifier: process.env.USER_IDENTIFIER || 'user@smarttech.com',
        password: process.env.USER_PASSWORD || 'user123'
      });

      if (userLoginResponse.statusCode === 200 && userLoginResponse.body?.token) {
        const userToken = userLoginResponse.body.token;

        // Get another image ID to test with
        const productsResponse = await makeRequest('GET', '/api/v1/products?limit=10');
        let anotherImageId = null;
        if (productsResponse.statusCode === 200 && productsResponse.body?.products?.length > 0) {
          const productWithImages = productsResponse.body.products.find(p => 
            p.images && p.images.length > 2
          );
          if (productWithImages && productWithImages.images.length > 2) {
            anotherImageId = productWithImages.images[2]?.id;
          }
        }

        if (anotherImageId) {
          // Try to delete image with user token
          const authzTestResponse = await makeRequest(
            'DELETE',
            `/api/v1/images/${anotherImageId}`,
            null,
            { 'Authorization': `Bearer ${userToken}` }
          );

          recordTest(
            'Authorization Check (Non-Admin Cannot Delete)',
            authzTestResponse.statusCode === 403 || authzTestResponse.statusCode === 401,
            {
              statusCode: authzTestResponse.statusCode,
              forbidden: authzTestResponse.statusCode === 403
            }
          );
        } else {
          skipTest('Authorization Check (Non-Admin)', 'Could not find additional image for testing');
        }
      } else {
        skipTest('Authorization Check (Non-Admin)', 'Could not login as regular user');
      }
    } catch (error) {
      recordTest('Authorization Check (Non-Admin)', false, { error: 'Request failed' }, error);
    }

    // ============================================
    // Test 12: Bulk Image Deletion Test
    // ============================================
    console.log('\n--- Test 12: Bulk Image Deletion Test ---');
    try {
      // Get product with multiple images
      const productsResponse = await makeRequest('GET', '/api/v1/products?limit=10');
      let bulkDeleteProductId = null;
      let bulkDeleteImageIds = [];

      if (productsResponse.statusCode === 200 && productsResponse.body?.products?.length > 0) {
        const productWithMultipleImages = productsResponse.body.products.find(p => 
          p.images && p.images.length >= 3
        );

        if (productWithMultipleImages) {
          bulkDeleteProductId = productWithMultipleImages.id;
          bulkDeleteImageIds = productWithMultipleImages.images.slice(0, 2).map(img => img.id);
          
          console.log(`Found product ${bulkDeleteProductId} with ${bulkDeleteImageIds.length} images for bulk deletion test`);
        }
      }

      if (bulkDeleteImageIds.length >= 2) {
        let successCount = 0;
        let failCount = 0;

        // Delete multiple images
        for (const imageId of bulkDeleteImageIds) {
          try {
            const deleteResponse = await makeRequest(
              'DELETE',
              `/api/v1/images/${imageId}`,
              null,
              { 'Authorization': `Bearer ${authToken}` }
            );

            if (deleteResponse.statusCode === 200 || deleteResponse.statusCode === 204) {
              successCount++;
              console.log(`✅ Successfully deleted image ${imageId}`);
            } else {
              failCount++;
              console.log(`❌ Failed to delete image ${imageId}: ${deleteResponse.statusCode}`);
            }
          } catch (error) {
            failCount++;
            console.log(`❌ Error deleting image ${imageId}:`, error.message);
          }
        }

        recordTest(
          'Bulk Image Deletion',
          successCount === bulkDeleteImageIds.length,
          {
            totalImages: bulkDeleteImageIds.length,
            successCount,
            failCount,
            successRate: `${((successCount / bulkDeleteImageIds.length) * 100).toFixed(2)}%`
          }
        );
      } else {
        skipTest('Bulk Image Deletion', 'No product with 3+ images found for testing');
      }
    } catch (error) {
      recordTest('Bulk Image Deletion', false, { error: 'Request failed' }, error);
    }

  } catch (error) {
    console.error('\n❌ Test suite execution error:', error);
  }

  // ============================================
  // Generate Test Report
  // ============================================
  console.log('\n========================================');
  console.log('Test Report');
  console.log('========================================\n');

  const report = {
    testSuite: 'Image Deletion Fix - Verification Test',
    executedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    summary: testResults.summary,
    tests: testResults.tests,
    conclusions: []
  };

  // Generate conclusions
  const mainTest = testResults.tests.find(t => t.testName.includes('MAIN TEST'));
  const updateTest = testResults.tests.find(t => t.testName.includes('Update Image Metadata'));
  const versionsTest = testResults.tests.find(t => t.testName.includes('Get Image Versions'));
  const primaryTest = testResults.tests.find(t => t.testName.includes('Set Primary Image'));
  const authTest = testResults.tests.find(t => t.testName.includes('Authentication Required'));
  const authzTest = testResults.tests.find(t => t.testName.includes('Authorization Check'));

  if (mainTest) {
    if (mainTest.status === 'PASS') {
      report.conclusions.push({
        type: 'SUCCESS',
        message: '✅ Image deletion fix is working correctly',
        details: 'DELETE requests to /api/v1/images/{imageId} now succeed (200/204)',
        recommendation: 'Fix is complete and ready for production'
      });
    } else {
      report.conclusions.push({
        type: 'FAILURE',
        message: '❌ Image deletion fix is NOT working',
        details: 'DELETE requests still return 404 Not Found',
        recommendation: 'Further investigation required - check route mounting and URL structure'
      });
    }
  }

  if (updateTest && updateTest.status === 'PASS' &&
      versionsTest && versionsTest.status === 'PASS' &&
      primaryTest && primaryTest.status === 'PASS') {
    report.conclusions.push({
      type: 'SUCCESS',
      message: '✅ All corrected image operation URLs are working',
      details: 'PUT, POST, and GET operations all succeed with corrected /images/{id} URLs',
      recommendation: 'All image operations are functioning correctly'
    });
  }

  if (authTest && authTest.status === 'PASS') {
    report.conclusions.push({
      type: 'SUCCESS',
      message: '✅ Authentication is properly enforced',
      details: 'DELETE requests without authentication return 401/403',
      recommendation: 'Authentication middleware is working correctly'
    });
  }

  if (authzTest && authzTest.status === 'PASS') {
    report.conclusions.push({
      type: 'SUCCESS',
      message: '✅ Authorization is properly enforced',
      details: 'Non-admin users cannot delete images (403 Forbidden)',
      recommendation: 'Authorization middleware is working correctly'
    });
  }

  // Print summary
  console.log('Summary:');
  console.log(`  Total Tests: ${testResults.summary.total}`);
  console.log(`  Passed: ${testResults.summary.passed} ✅`);
  console.log(`  Failed: ${testResults.summary.failed} ❌`);
  console.log(`  Skipped: ${testResults.summary.skipped} ⏭️`);
  console.log(`  Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);

  // Print conclusions
  console.log('\nConclusions:');
  report.conclusions.forEach(conclusion => {
    console.log(`  ${conclusion.type}: ${conclusion.message}`);
    if (conclusion.details) {
      console.log(`    Details: ${conclusion.details}`);
    }
    if (conclusion.recommendation) {
      console.log(`    Recommendation: ${conclusion.recommendation}`);
    }
  });

  // Save report to file
  const reportPath = path.join(__dirname, 'image-deletion-fix-verification-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full test report saved to: ${reportPath}`);

  // Print detailed results
  console.log('\nDetailed Results:');
  console.log('================\n');
  testResults.tests.forEach(test => {
    console.log(`[${test.status}] ${test.testName}`);
    console.log(`  Time: ${test.timestamp}`);
    console.log(`  Details:`, JSON.stringify(test.details, null, 2));
    if (test.error) {
      console.log(`  Error: ${test.error}`);
    }
    console.log('');
  });

  console.log('\n========================================');
  console.log('Test Suite Complete');
  console.log('========================================\n');

  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
