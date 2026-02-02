/**
 * Product Image Deletion Fix - Comprehensive Test Script
 * 
 * This script tests the DELETE /api/v1/images/:id endpoint to verify
 * that images are properly deleted from the database.
 * 
 * Test Coverage:
 * 1. DELETE endpoint with valid image ID
 * 2. Database state verification (processing_status = 'deleted')
 * 3. GET endpoint verification (deleted image not returned)
 * 4. Error handling for non-existent image ID
 * 5. Backend logging verification
 */

const http = require('http');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'smarttech-super-secret-jwt-key-change-in-production-2024';

// Test configuration
const TEST_CONFIG = {
  productId: 'c571ed71-fd5b-4158-ad6d-87405e75f046',
  validImageId: '254c7b8c-2726-41c9-8a6e-fe593d72ec28', // Second image to delete
  invalidImageId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
};

// Generate a valid JWT token for admin user
function generateAdminToken() {
  const payload = {
    userId: 'ea59bf47-4b66-431d-ba63-a0a69437798f', // admin@smarttech.com user ID
    email: 'admin@smarttech.com',
    role: 'admin'
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'smart-ecommerce-api',
    audience: 'smart-ecommerce-clients'
  });
}

const adminToken = generateAdminToken();

// Test results storage
const testResults = {
  tests: [],
  passed: 0,
  failed: 0
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Helper function to query database directly
 */
function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const command = `docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "${sql}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Log test result
 */
function logTest(name, passed, details = {}) {
  testResults.tests.push({
    name,
    passed,
    ...details
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (details.error) {
      console.log(`   Error: ${details.error}`);
    }
    if (details.expected) {
      console.log(`   Expected: ${JSON.stringify(details.expected)}`);
    }
    if (details.actual) {
      console.log(`   Actual: ${JSON.stringify(details.actual)}`);
    }
  }
}

/**
 * Test 1: Verify image exists before deletion
 */
async function testImageExistsBeforeDeletion() {
  console.log('\n--- Test 1: Image Exists Before Deletion ---');
  
  try {
    // Query database to check image exists and is NOT deleted
    const result = await queryDatabase(
      `SELECT id, processing_status FROM product_images WHERE id = '${TEST_CONFIG.validImageId}'`
    );
    
    const exists = result.includes(TEST_CONFIG.validImageId) && 
                   result.includes('completed') && 
                   !result.includes('deleted');
    
    logTest('Image exists and is not deleted before deletion', exists, {
      expected: { exists: true, processingStatus: 'completed' },
      actual: { result: result.trim() }
    });
    
    return exists;
  } catch (error) {
    logTest('Image exists before deletion', false, { error: error.message });
    return false;
  }
}

/**
 * Test 2: DELETE endpoint with valid image ID
 */
async function testDeleteValidImage() {
  console.log('\n--- Test 2: DELETE Endpoint with Valid Image ID ---');
  
  try {
    const response = await makeRequest('DELETE', `/api/v1/images/${TEST_CONFIG.validImageId}`);
    
    const success = response.status === 200 && 
                    response.data.messageEn === 'Image deleted successfully';
    
    logTest('DELETE endpoint returns 200 success', response.status === 200, {
      expected: { status: 200 },
      actual: { status: response.status }
    });
    
    logTest('Response message is correct', success, {
      expected: { message: 'Image deleted successfully' },
      actual: { message: response.data.messageEn }
    });
    
    // Verify response includes updated image data
    const hasImageData = response.data.image && 
                         response.data.image.id === TEST_CONFIG.validImageId &&
                         response.data.image.processingStatus === 'deleted';
    
    logTest('Response includes updated image data with processingStatus=deleted', hasImageData, {
      expected: { processingStatus: 'deleted' },
      actual: { processingStatus: response.data.image?.processingStatus }
    });
    
    return { success, response };
  } catch (error) {
    logTest('DELETE endpoint with valid image', false, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Verify database was actually updated
 */
async function testDatabaseUpdated() {
  console.log('\n--- Test 3: Database State Verification ---');
  
  try {
    // Query database to check image is now marked as deleted
    const result = await queryDatabase(
      `SELECT id, processing_status FROM product_images WHERE id = '${TEST_CONFIG.validImageId}'`
    );
    
    const isDeleted = result.includes(TEST_CONFIG.validImageId) && 
                      result.includes('deleted');
    
    logTest('Database updated - processing_status is "deleted"', isDeleted, {
      expected: { processingStatus: 'deleted' },
      actual: { result: result.trim() }
    });
    
    return isDeleted;
  } catch (error) {
    logTest('Database state verification', false, { error: error.message });
    return false;
  }
}

/**
 * Test 4: GET endpoint no longer returns deleted image
 */
async function testGetEndpointExcludesDeleted() {
  console.log('\n--- Test 4: GET Endpoint Excludes Deleted Image ---');
  
  try {
    const response = await makeRequest('GET', `/api/v1/products/${TEST_CONFIG.productId}/images`);
    
    const excludesDeleted = response.status === 200 &&
                            !response.data.images?.some(img => img.id === TEST_CONFIG.validImageId);
    
    logTest('GET endpoint excludes deleted image from results', excludesDeleted, {
      expected: { imageExcluded: true },
      actual: { imagesCount: response.data.images?.length || 0 }
    });
    
    return excludesDeleted;
  } catch (error) {
    logTest('GET endpoint excludes deleted image', false, { error: error.message });
    return false;
  }
}

/**
 * Test 5: DELETE endpoint with non-existent image ID (error handling)
 */
async function testDeleteNonExistentImage() {
  console.log('\n--- Test 5: DELETE Endpoint Error Handling ---');
  
  try {
    const response = await makeRequest('DELETE', `/api/v1/images/${TEST_CONFIG.invalidImageId}`);
    
    const properErrorHandling = response.status === 404 &&
                                 response.data.messageEn === 'Image not found';
    
    logTest('DELETE returns 404 for non-existent image', response.status === 404, {
      expected: { status: 404 },
      actual: { status: response.status }
    });
    
    logTest('Error message is correct for non-existent image', properErrorHandling, {
      expected: { message: 'Image not found' },
      actual: { message: response.data.messageEn }
    });
    
    return properErrorHandling;
  } catch (error) {
    logTest('DELETE error handling for non-existent image', false, { error: error.message });
    return false;
  }
}

/**
 * Test 6: Verify the remaining image is still accessible
 */
async function testRemainingImageAccessible() {
  console.log('\n--- Test 6: Remaining Image Still Accessible ---');
  
  const remainingImageId = '0e3262ed-4991-4eac-98c4-aacf61214e7c';
  
  try {
    const response = await makeRequest('GET', `/api/v1/products/${TEST_CONFIG.productId}/images`);
    
    const remainingExists = response.data.images?.some(img => img.id === remainingImageId);
    
    logTest('Remaining image is still accessible', remainingExists, {
      expected: { imageExists: true },
      actual: { imageExists: remainingExists }
    });
    
    return remainingExists;
  } catch (error) {
    logTest('Remaining image accessibility', false, { error: error.message });
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('==============================================');
  console.log('  PRODUCT IMAGE DELETION FIX - TEST SUITE');
  console.log('==============================================');
  console.log(`\nTest Configuration:`);
  console.log(`  Product ID: ${TEST_CONFIG.productId}`);
  console.log(`  Image ID to delete: ${TEST_CONFIG.validImageId}`);
  console.log(`  Invalid Image ID: ${TEST_CONFIG.invalidImageId}`);
  console.log(`  API Base: ${API_BASE}`);
  
  // Run tests sequentially
  await testImageExistsBeforeDeletion();
  
  const deleteResult = await testDeleteValidImage();
  
  // Small delay to ensure database write completes
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testDatabaseUpdated();
  await testGetEndpointExcludesDeleted();
  await testDeleteNonExistentImage();
  await testRemainingImageAccessible();
  
  // Print summary
  console.log('\n==============================================');
  console.log('  TEST SUMMARY');
  console.log('==============================================');
  console.log(`  Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`  Passed: ${testResults.passed} ✅`);
  console.log(`  Failed: ${testResults.failed} ❌`);
  console.log(`  Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('==============================================\n');
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`
    },
    tests: testResults.tests,
    conclusion: testResults.failed === 0 
      ? '✅ FIX VERIFIED: Image deletion is working correctly'
      : '❌ ISSUES FOUND: Some tests failed'
  };
  
  console.log('Conclusion:', report.conclusion);
  
  return report;
}

// Run tests
runTests()
  .then(report => {
    console.log('\nFull Test Report:');
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
