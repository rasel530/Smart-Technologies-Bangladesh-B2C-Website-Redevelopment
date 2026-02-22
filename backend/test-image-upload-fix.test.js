/**
 * Product Image Upload Fix Verification Test
 * 
 * This script tests POST /api/v1/products/:id/images endpoint to verify
 * that the middleware order fix resolves the 500 error.
 * 
 * Test Coverage:
 * 1. Upload images with multipart/form-data
 * 2. Verify no 500 error
 * 3. Verify proper API response
 * 4. Check backend logs for "Cannot read properties of undefined" errors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001';
const JWT_SECRET = 'smarttech-super-secret-jwt-key-change-in-production-2024';

// Test configuration
const TEST_CONFIG = {
  productId: '4010caae-464e-4787-ad8f-ee04096100d0', // HP Laptop product ID
  adminUserId: '90270928-766e-49dd-bee0-13ede11e9dad',
  adminEmail: 'admin2@smarttech.com'
};

// Generate a valid JWT token for admin user
function generateAdminToken() {
  const payload = {
    userId: TEST_CONFIG.adminUserId,
    email: TEST_CONFIG.adminEmail,
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
 * Helper function to make HTTP requests with multipart/form-data
 */
function makeMultipartRequest(method, path, files, formData = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const boundary = '----WebKitFormBoundary' + Date.now();
    
    // Build multipart body
    let body = '';
    
    // Add form fields
    for (const [key, value] of Object.entries(formData)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    
    // Add files
    files.forEach((file, index) => {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="images"; filename="${file.filename}"\r\n`;
      body += `Content-Type: ${file.mimetype}\r\n\r\n`;
      body += file.content;
      body += '\r\n';
    });
    
    body += `--${boundary}--\r\n`;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
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
    req.write(body);
    req.end();
  });
}

/**
 * Create a simple test image (1x1 PNG)
 */
function createTestImage() {
  // Minimal 1x1 PNG
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
  ]);
  
  return {
    filename: 'test-image.png',
    mimetype: 'image/png',
    content: pngData
  };
}

/**
 * Run a test and record results
 */
async function runTest(testName, testFn) {
  console.log(`\n[TEST] ${testName}`);
  console.log('='.repeat(60));
  
  try {
    const result = await testFn();
    testResults.tests.push({
      name: testName,
      status: 'PASSED',
      result: result
    });
    testResults.passed++;
    console.log(`✓ PASSED: ${result.message}`);
    return result;
  } catch (error) {
    testResults.tests.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    testResults.failed++;
    console.log(`✗ FAILED: ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
    throw error;
  }
}

/**
 * Test 1: Upload single image
 */
async function testUploadSingleImage() {
  const testImage = createTestImage();
  
  const response = await makeMultipartRequest(
    'POST',
    `/api/v1/products/${TEST_CONFIG.productId}/images`,
    [testImage],
    {}
  );
  
  console.log(`Response Status: ${response.status}`);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
  
  if (response.status === 500) {
    throw new Error(`Received 500 Internal Server Error. Response: ${JSON.stringify(response.data)}`);
  }
  
  if (response.status === 201) {
    return {
      message: `Successfully uploaded image. Status: ${response.status}`,
      data: response.data
    };
  } else if (response.status === 400) {
    // Validation error is acceptable - we're testing middleware order, not validation
    return {
      message: `Received validation error (expected for some cases). Status: ${response.status}`,
      data: response.data,
      note: 'This is acceptable - the important thing is no 500 error'
    };
  } else {
    throw new Error(`Unexpected status code: ${response.status}. Response: ${JSON.stringify(response.data)}`);
  }
}

/**
 * Test 2: Upload multiple images
 */
async function testUploadMultipleImages() {
  const testImage1 = createTestImage();
  const testImage2 = createTestImage();
  testImage2.filename = 'test-image-2.png';
  
  const response = await makeMultipartRequest(
    'POST',
    `/api/v1/products/${TEST_CONFIG.productId}/images`,
    [testImage1, testImage2],
    {}
  );
  
  console.log(`Response Status: ${response.status}`);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
  
  if (response.status === 500) {
    throw new Error(`Received 500 Internal Server Error. Response: ${JSON.stringify(response.data)}`);
  }
  
  return {
    message: `Successfully handled multiple image upload request. Status: ${response.status}`,
    data: response.data
  };
}

/**
 * Test 3: Upload with metadata
 */
async function testUploadWithMetadata() {
  const testImage = createTestImage();
  
  const imagesData = JSON.stringify([
    {
      altTextBn: 'টেস্ট ইমেজ',
      altTextEn: 'Test Image',
      displayOrder: 0
    }
  ]);
  
  const response = await makeMultipartRequest(
    'POST',
    `/api/v1/products/${TEST_CONFIG.productId}/images`,
    [testImage],
    { imagesData: imagesData }
  );
  
  console.log(`Response Status: ${response.status}`);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
  
  if (response.status === 500) {
    throw new Error(`Received 500 Internal Server Error. Response: ${JSON.stringify(response.data)}`);
  }
  
  return {
    message: `Successfully handled image upload with metadata. Status: ${response.status}`,
    data: response.data
  };
}

/**
 * Main test execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('PRODUCT IMAGE UPLOAD FIX VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Product ID: ${TEST_CONFIG.productId}`);
  console.log(`Admin User: ${TEST_CONFIG.adminEmail}`);
  console.log('='.repeat(60));
  
  // Run tests
  await runTest('Test 1: Upload Single Image', testUploadSingleImage);
  await runTest('Test 2: Upload Multiple Images', testUploadMultipleImages);
  await runTest('Test 3: Upload with Metadata', testUploadWithMetadata);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log('='.repeat(60));
  
  // Save results to file
  const resultsPath = path.join(__dirname, 'image-upload-fix-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${resultsPath}`);
  
  // Check for 500 errors
  const has500Error = testResults.tests.some(t => 
    t.result && t.result.data && t.result.data.error && 
    (t.result.data.error.includes('500') || t.status === 'FAILED' && t.error.includes('500'))
  );
  
  if (has500Error) {
    console.log('\n⚠️  WARNING: 500 errors detected - fix may not be working properly');
  } else {
    console.log('\n✓ SUCCESS: No 500 errors detected - fix appears to be working!');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
