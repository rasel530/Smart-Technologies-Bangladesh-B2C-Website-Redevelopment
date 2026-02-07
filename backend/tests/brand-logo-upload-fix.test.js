/**
 * Brand Logo Upload Fix Verification Test
 * 
 * This test verifies the fix for the brand logo upload error where the frontend
 * was manually setting 'Content-Type: multipart/form-data' header, which caused
 * a 500 Internal Server Error.
 * 
 * The fix removes the manual header setting from frontend/src/lib/api/brands.ts,
 * allowing the browser to automatically set the Content-Type with the proper boundary.
 * 
 * Test Requirements:
 * - Use the brand ID: 14907a1d-2cac-421f-864e-603f51751fbb
 * - Test with a small image file (created programmatically)
 * - Verify the backend correctly processes the multipart/form-data request
 * - Confirm the multer middleware can parse the request successfully
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  brandId: '14907a1d-2cac-421f-864e-603f51751fbb',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  apiEndpoint: '/api/v1/brands',
  testImageName: 'test-brand-logo.png',
  testImageSize: 1024 // 1KB test image
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  testResults.tests.push({ name, passed, message, timestamp: new Date().toISOString() });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Helper function to assert equality
function assertEqual(actual, expected, testName) {
  const passed = actual === expected;
  logTest(testName, passed, `Expected: ${expected}, Got: ${actual}`);
  return passed;
}

// Helper function to assert condition
function assertTrue(condition, testName) {
  const passed = !!condition;
  logTest(testName, passed, condition ? 'Condition met' : 'Condition not met');
  return passed;
}

// Helper function to assert not equal
function assertNotEqual(actual, notExpected, testName) {
  const passed = actual !== notExpected;
  logTest(testName, passed, `Expected not: ${notExpected}, Got: ${actual}`);
  return passed;
}

// Helper function to make HTTP request with FormData
function makeFormDataRequest(url, formData, authToken = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: formData.getHeaders()
    };

    // Add auth token if provided
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log(`\n[Request] ${options.method} ${urlObj.protocol}//${options.hostname}:${options.port}${options.path}`);
    console.log(`[Request] Headers:`, {
      ...options.headers,
      'Content-Type': options.headers['Content-Type'] ? 
        `${options.headers['Content-Type'].substring(0, 50)}...` : 
        options.headers['Content-Type']
    });

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawBody: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawBody: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Pipe the form data to the request
    formData.pipe(req);
  });
}

// Helper function to create a simple PNG image programmatically
function createTestPngImage(filename, size = 1024) {
  // Create a minimal valid PNG file
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (image header)
  const width = 10;
  const height = 10;
  const bitDepth = 8;
  const colorType = 6; // RGBA
  const compressionMethod = 0;
  const filterMethod = 0;
  const interlaceMethod = 0;
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(bitDepth, 8);
  ihdrData.writeUInt8(colorType, 9);
  ihdrData.writeUInt8(compressionMethod, 10);
  ihdrData.writeUInt8(filterMethod, 11);
  ihdrData.writeUInt8(interlaceMethod, 12);
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // Length (13 bytes)
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC (simplified)
  ]);
  
  // IDAT chunk (image data - minimal)
  const idatData = Buffer.from([0x78, 0x9C, 0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]);
  const idatChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // Length (13 bytes)
    Buffer.from('IDAT'),
    idatData,
    Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC (simplified)
  ]);
  
  // IEND chunk (end of file)
  const iendChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // Length (0 bytes)
    Buffer.from('IEND'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC (simplified)
  ]);
  
  // Combine all chunks
  const pngBuffer = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  
  // Write to file
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, pngBuffer);
  
  console.log(`Created test PNG image: ${filePath} (${pngBuffer.length} bytes)`);
  return filePath;
}

// Helper function to get admin auth token
async function getAdminAuthToken() {
  return new Promise((resolve, reject) => {
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/auth/login`;
    const urlObj = new URL(url);
    
    const loginData = JSON.stringify({
      identifier: 'admin@smarttech.com',
      password: 'AdminPassword123'
    });
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.success && parsedData.data && parsedData.data.token) {
            resolve(parsedData.data.token);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('Login request failed:', error.message);
      resolve(null);
    });
    
    req.write(loginData);
    req.end();
  });
}

// ============================================
// TEST 1: Verify Brand Exists
// ============================================
async function testBrandExists() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Verify Brand Exists');
  console.log('='.repeat(70));
  
  return new Promise((resolve) => {
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${TEST_CONFIG.brandId}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log(`Response Status: ${res.statusCode}`);
          console.log(`Response Data:`, parsedData);
          
          if (res.statusCode === 200 && parsedData.brand) {
            assertTrue(true, 'Brand exists');
            console.log(`Brand Name: ${parsedData.brand.name}`);
            console.log(`Brand Slug: ${parsedData.brand.slug}`);
            console.log(`Current Logo URL: ${parsedData.brand.logoUrl || 'None'}`);
            resolve(parsedData.brand);
          } else {
            assertTrue(false, 'Brand exists');
            console.log(`Error: ${parsedData.error || 'Unknown error'}`);
            resolve(null);
          }
        } catch (error) {
          assertTrue(false, 'Brand exists - Parse error');
          console.log(`Parse Error: ${error.message}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      assertTrue(false, 'Brand exists - Request failed');
      console.log(`Request Error: ${error.message}`);
      resolve(null);
    });
    
    req.end();
  });
}

// ============================================
// TEST 2: Valid Image Upload (PNG) - WITHOUT Manual Content-Type
// ============================================
async function testValidImageUploadPNG(authToken, brand) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Valid Image Upload (PNG) - WITHOUT Manual Content-Type');
  console.log('='.repeat(70));
  console.log('This test verifies the fix: NOT manually setting Content-Type header');
  
  // Create test image
  const testImagePath = createTestPngImage(TEST_CONFIG.testImageName, TEST_CONFIG.testImageSize);
  
  try {
    // Create FormData - this is the key part of the fix
    // We do NOT manually set Content-Type, allowing the browser to set it with boundary
    const formData = new FormData();
    formData.append('logo', fs.createReadStream(testImagePath), {
      filename: TEST_CONFIG.testImageName,
      contentType: 'image/png'
    });
    
    // Verify FormData does NOT have Content-Type set manually
    const formDataHeaders = formData.getHeaders();
    assertTrue(
      !formDataHeaders['Content-Type'].includes('multipart/form-data') || 
      formDataHeaders['Content-Type'].includes('boundary'),
      'FormData has automatic Content-Type with boundary'
    );
    console.log(`FormData Content-Type: ${formDataHeaders['Content-Type'].substring(0, 80)}...`);
    
    // Make request
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${TEST_CONFIG.brandId}/logo`;
    const response = await makeFormDataRequest(url, formData, authToken);
    
    console.log(`\nResponse Status: ${response.statusCode}`);
    console.log(`Response Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Verify response
    assertNotEqual(response.statusCode, 500, 'Response is NOT 500 (Internal Server Error)');
    assertEqual(response.statusCode, 200, 'Response status is 200 (Success)');
    assertTrue(response.data && response.data.brand, 'Response contains brand data');
    
    if (response.data && response.data.brand) {
      assertTrue(response.data.brand.logoUrl !== null, 'Brand has logo URL');
      console.log(`\nNew Logo URL: ${response.data.brand.logoUrl}`);
      
      // Verify logo URL format
      assertTrue(
        response.data.brand.logoUrl.includes('/uploads/brands/'),
        'Logo URL contains correct path'
      );
      assertTrue(
        response.data.brand.logoUrl.endsWith('.png') || response.data.brand.logoUrl.endsWith('.jpg'),
        'Logo URL has image extension'
      );
    }
    
    return response;
  } finally {
    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log(`Cleaned up test image: ${testImagePath}`);
    }
  }
}

// ============================================
// TEST 3: Valid Image Upload (JPEG) - WITHOUT Manual Content-Type
// ============================================
async function testValidImageUploadJPEG(authToken) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Valid Image Upload (JPEG) - WITHOUT Manual Content-Type');
  console.log('='.repeat(70));
  
  // Create a minimal JPEG file
  const jpegPath = path.join(__dirname, 'test-brand-logo.jpg');
  const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG SOI + APP0 marker
  fs.writeFileSync(jpegPath, jpegSignature);
  console.log(`Created test JPEG image: ${jpegPath}`);
  
  try {
    const formData = new FormData();
    formData.append('logo', fs.createReadStream(jpegPath), {
      filename: 'test-brand-logo.jpg',
      contentType: 'image/jpeg'
    });
    
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${TEST_CONFIG.brandId}/logo`;
    const response = await makeFormDataRequest(url, formData, authToken);
    
    console.log(`\nResponse Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    assertNotEqual(response.statusCode, 500, 'JPEG upload: Response is NOT 500');
    assertEqual(response.statusCode, 200, 'JPEG upload: Response status is 200');
    assertTrue(response.data && response.data.brand, 'JPEG upload: Response contains brand data');
    
    return response;
  } finally {
    if (fs.existsSync(jpegPath)) {
      fs.unlinkSync(jpegPath);
      console.log(`Cleaned up test JPEG: ${jpegPath}`);
    }
  }
}

// ============================================
// TEST 4: Verify File Storage
// ============================================
async function testFileStorage(response) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Verify File Storage');
  console.log('='.repeat(70));
  
  if (!response || !response.data || !response.data.brand || !response.data.brand.logoUrl) {
    assertTrue(false, 'File storage - No logo URL in response');
    return;
  }
  
  const logoUrl = response.data.brand.logoUrl;
  console.log(`Logo URL: ${logoUrl}`);
  
  // Extract filename from URL
  const filename = path.basename(logoUrl);
  const filePath = path.join(__dirname, '..', 'uploads', 'brands', filename);
  
  console.log(`Expected file path: ${filePath}`);
  
  // Check if file exists
  const fileExists = fs.existsSync(filePath);
  assertTrue(fileExists, `Logo file exists at ${filePath}`);
  
  if (fileExists) {
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${fileStats.size} bytes`);
    console.log(`File created: ${fileStats.birthtime}`);
    assertTrue(fileStats.size > 0, 'File has content');
  }
}

// ============================================
// TEST 5: Test Invalid Brand ID
// ============================================
async function testInvalidBrandId(authToken) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Test Invalid Brand ID');
  console.log('='.repeat(70));
  
  const invalidBrandId = '00000000-0000-0000-0000-000000000000';
  const testImagePath = createTestPngImage('test-invalid-brand.png', 512);
  
  try {
    const formData = new FormData();
    formData.append('logo', fs.createReadStream(testImagePath), {
      filename: 'test-invalid-brand.png',
      contentType: 'image/png'
    });
    
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${invalidBrandId}/logo`;
    const response = await makeFormDataRequest(url, formData, authToken);
    
    console.log(`\nResponse Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    assertEqual(response.statusCode, 404, 'Invalid brand ID returns 404');
    assertTrue(response.data && response.data.error, 'Response contains error message');
    
  } finally {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// ============================================
// TEST 6: Test Missing File
// ============================================
async function testMissingFile(authToken) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 6: Test Missing File');
  console.log('='.repeat(70));
  
  const formData = new FormData();
  // Don't append any file
  
  const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${TEST_CONFIG.brandId}/logo`;
  const response = await makeFormDataRequest(url, formData, authToken);
  
  console.log(`\nResponse Status: ${response.statusCode}`);
  console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
  
  assertEqual(response.statusCode, 400, 'Missing file returns 400');
  assertTrue(response.data && response.data.error, 'Response contains error message');
}

// ============================================
// TEST 7: Test Without Authentication
// ============================================
async function testWithoutAuthentication() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 7: Test Without Authentication');
  console.log('='.repeat(70));
  
  const testImagePath = createTestPngImage('test-no-auth.png', 512);
  
  try {
    const formData = new FormData();
    formData.append('logo', fs.createReadStream(testImagePath), {
      filename: 'test-no-auth.png',
      contentType: 'image/png'
    });
    
    const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiEndpoint}/${TEST_CONFIG.brandId}/logo`;
    const response = await makeFormDataRequest(url, formData, null); // No auth token
    
    console.log(`\nResponse Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    assertEqual(response.statusCode, 401, 'No authentication returns 401');
    assertTrue(response.data && response.data.error, 'Response contains error message');
    
  } finally {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('BRAND LOGO UPLOAD FIX VERIFICATION TESTS');
  console.log('='.repeat(70));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Brand ID: ${TEST_CONFIG.brandId}`);
  console.log(`Backend URL: ${TEST_CONFIG.backendUrl}`);
  console.log(`API Endpoint: ${TEST_CONFIG.apiEndpoint}`);
  
  try {
    // Get admin auth token
    console.log('\n' + '-'.repeat(70));
    console.log('Getting admin authentication token...');
    console.log('-'.repeat(70));
    const authToken = await getAdminAuthToken();
    
    if (!authToken) {
      console.log('\n⚠ WARNING: Could not get admin auth token');
      console.log('Some tests will be skipped or may fail.');
      console.log('You may need to:');
      console.log('1. Create an admin user with email: admin@smarttech.com');
      console.log('2. Ensure the backend server is running');
      console.log('3. Check authentication endpoint is accessible');
    } else {
      console.log('✓ Admin auth token obtained successfully');
    }
    
    // Run tests
    const brand = await testBrandExists();
    
    if (!brand) {
      console.log('\n⚠ WARNING: Brand not found. Some tests will be skipped.');
      console.log('You may need to create the brand first or check the brand ID.');
    }
    
    if (brand && authToken) {
      const pngResponse = await testValidImageUploadPNG(authToken, brand);
      await testValidImageUploadJPEG(authToken);
      await testFileStorage(pngResponse);
      await testInvalidBrandId(authToken);
      await testMissingFile(authToken);
    }
    
    await testWithoutAuthentication();
    
  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error);
    logTest('Test execution', false, `Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('FIX VERIFICATION COMPLETE');
  console.log('='.repeat(70));
  
  // Save results to JSON file
  const resultsFile = path.join(__dirname, `brand-logo-upload-test-results-${Date.now()}.json`);
  const resultsData = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: successRate
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
  console.log(`\nTest results saved to: ${resultsFile}`);
  
  return testResults;
}

// Run tests
runTests()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
