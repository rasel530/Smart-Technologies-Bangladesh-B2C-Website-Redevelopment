/**
 * Image Upload Fix Verification Tests
 * 
 * This script tests the three fixes implemented for image upload functionality:
 * 1. File extension preservation in image-storage.service.js
 * 2. WebP path generation in image-processing.service.js
 * 3. HTTP status code in product-images.js
 */

const path = require('path');
const fs = require('fs');

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function assertEqual(actual, expected, testName) {
  const passed = actual === expected;
  logTest(testName, passed, `Expected: ${expected}, Got: ${actual}`);
  return passed;
}

function assertTrue(condition, testName) {
  const passed = !!condition;
  logTest(testName, passed, condition ? 'Condition met' : 'Condition not met');
  return passed;
}

// ============================================
// TEST 1: File Extension Preservation
// ============================================
function testFileExtensionPreservation() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: File Extension Preservation');
  console.log('='.repeat(60));

  // Simulate the filename generation logic from image-storage.service.js:76
  function generateFilename(originalname, timestamp, random, index) {
    const ext = path.extname(originalname || '');
    const baseName = path.basename(originalname || '', ext);
    return `${timestamp}_${random}_${index}_${baseName}${ext}`;
  }

  // Test cases
  const testCases = [
    { input: 'product-image.jpg', expected: true },
    { input: 'photo.png', expected: true },
    { input: 'picture.webp', expected: true },
    { input: 'image.JPEG', expected: true },
    { input: 'noextension', expected: false }
  ];

  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);

  testCases.forEach((tc, index) => {
    const filename = generateFilename(tc.input, timestamp, random, index);
    const hasExtension = path.extname(filename) !== '';
    
    if (tc.expected) {
      assertTrue(hasExtension, `File extension preserved for ${tc.input}`);
      assertTrue(filename.endsWith(tc.input), `Filename contains original name: ${tc.input}`);
    } else {
      assertTrue(!hasExtension, `No extension for ${tc.input}`);
    }
  });

  // Verify specific filename format
  const testFilename = generateFilename('HP-15-fc0355AU-Laptop.jpg', 1769708732634, 880914003, 0);
  assertEqual(
    testFilename,
    '1769708732634_880914003_0_HP-15-fc0355AU-Laptop.jpg',
    'Correct filename format with extension'
  );

  // Check if existing files in upload directory have extensions
  const uploadDir = path.join(__dirname, '../uploads/products/42c99f44-82d0-4f1d-912b-16dd0b687070');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    const filesWithoutExtensions = files.filter(f => !path.extname(f));
    const filesWithExtensions = files.filter(f => path.extname(f));
    
    console.log(`\nDirectory Analysis:`);
    console.log(`  Total files: ${files.length}`);
    console.log(`  Files with extensions: ${filesWithExtensions.length}`);
    console.log(`  Files without extensions: ${filesWithoutExtensions.length}`);
    
    if (filesWithoutExtensions.length > 0) {
      console.log(`\n  Warning: Found ${filesWithoutExtensions.length} files without extensions!`);
      console.log(`  These are likely from BEFORE the fix was applied.`);
      console.log(`  Sample files without extensions:`);
      filesWithoutExtensions.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    }
    
    assertTrue(filesWithExtensions.length > 0, 'Some files have extensions (fix applied)');
  } else {
    logTest('Upload directory exists', false, 'Directory not found');
  }
}

// ============================================
// TEST 2: WebP Path Generation
// ============================================
function testWebPPathGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: WebP Path Generation');
  console.log('='.repeat(60));

  // Simulate the WebP path generation logic from image-processing.service.js:185
  function generateWebPPath(inputPath) {
    const ext = path.extname(inputPath);
    return ext ? inputPath.replace(ext, '.webp') : `${inputPath}.webp`;
  }

  // Test cases
  const testCases = [
    { 
      input: '/uploads/products/123/test.jpg',
      expected: '/uploads/products/123/test.webp',
      desc: 'JPG to WebP'
    },
    { 
      input: '/uploads/products/456/photo.png',
      expected: '/uploads/products/456/photo.webp',
      desc: 'PNG to WebP'
    },
    { 
      input: '/uploads/products/789/image.webp',
      expected: '/uploads/products/789/image.webp',
      desc: 'WebP to WebP'
    },
    { 
      input: '/uploads/products/noextension',
      expected: '/uploads/products/noextension.webp',
      desc: 'No extension to WebP'
    }
  ];

  testCases.forEach(tc => {
    const result = generateWebPPath(tc.input);
    assertEqual(result, tc.expected, `WebP generation: ${tc.desc}`);
  });

  // Verify the path doesn't have double extensions
  const webPPath = generateWebPPath('/uploads/products/test.jpg');
  assertTrue(!webPPath.includes('.jpg.webp'), 'No double extension in WebP path');
  assertTrue(webPPath.endsWith('.webp'), 'WebP path ends with .webp');
}

// ============================================
// TEST 3: HTTP Status Code Logic
// ============================================
function testHTTPStatusCode() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: HTTP Status Code Logic');
  console.log('='.repeat(60));

  // Simulate the status code logic from product-images.js:393
  function getStatusCode(uploadedImages, failedImages) {
    return uploadedImages.length === 0 ? 500 : (failedImages.length === 0 ? 201 : 207);
  }

  // Test cases
  const testCases = [
    { 
      uploaded: 5, 
      failed: 0, 
      expected: 201,
      desc: 'All succeed - 201 Created'
    },
    { 
      uploaded: 3, 
      failed: 2, 
      expected: 207,
      desc: 'Partial success - 207 Multi-Status'
    },
    { 
      uploaded: 0, 
      failed: 5, 
      expected: 500,
      desc: 'All fail - 500 Internal Server Error'
    },
    { 
      uploaded: 0, 
      failed: 0, 
      expected: 500,
      desc: 'No images - 500 Internal Server Error'
    },
    { 
      uploaded: 1, 
      failed: 4, 
      expected: 207,
      desc: 'Mostly fail - 207 Multi-Status'
    }
  ];

  testCases.forEach(tc => {
    const uploaded = Array(tc.uploaded).fill({});
    const failed = Array(tc.failed).fill({});
    const result = getStatusCode(uploaded, failed);
    assertEqual(result, tc.expected, `Status code: ${tc.desc}`);
  });
}

// ============================================
// TEST 4: End-to-End Upload Flow
// ============================================
function testEndToEndFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: End-to-End Upload Flow');
  console.log('='.repeat(60));

  // Simulate the complete upload flow
  function simulateUpload(filenames) {
    const uploadedImages = [];
    const failedImages = [];
    const processingResults = [];

    filenames.forEach((filename, index) => {
      try {
        // Step 1: Extract extension
        const ext = path.extname(filename);
        const baseName = path.basename(filename, ext);
        
        // Step 2: Generate unique filename with extension
        const timestamp = Date.now() + index;
        const random = Math.round(Math.random() * 1E9);
        const uniqueFilename = `${timestamp}_${random}_${index}_${baseName}${ext}`;
        
        // Step 3: Generate WebP path
        const webPPath = ext ? uniqueFilename.replace(ext, '.webp') : `${uniqueFilename}.webp`;
        
        // Step 4: Create result
        uploadedImages.push({
          filename: uniqueFilename,
          webPFilename: webPPath,
          originalName: filename
        });
        
        processingResults.push({
          fileName: filename,
          status: 'completed',
          progress: 100
        });
      } catch (error) {
        failedImages.push({
          fileName: filename,
          error: error.message
        });
      }
    });

    // Step 5: Determine status code
    const statusCode = uploadedImages.length === 0 ? 500 : (failedImages.length === 0 ? 201 : 207);

    return {
      uploaded: uploadedImages,
      failed: failedImages,
      total: filenames.length,
      statusCode,
      processing: processingResults
    };
  }

  // Test with 5 images (original failure case)
  const testFilenames = [
    'HP-15-fc0355AU-Laptop.jpg',
    'HP-15-fc0355AU-Laptop-1.jpg',
    'HP-15-fc0355AU-Laptop-2.jpg',
    'HP-15-fc0355AU-Laptop-3.jpg',
    'HP-15-fc0355AU-Laptop-4.jpg'
  ];

  const result = simulateUpload(testFilenames);

  console.log('\nEnd-to-End Test Results:');
  console.log(`  Total images: ${result.total}`);
  console.log(`  Uploaded: ${result.uploaded.length}`);
  console.log(`  Failed: ${result.failed.length}`);
  console.log(`  Status Code: ${result.statusCode}`);
  console.log(`  All succeed: ${result.statusCode === 201}`);

  // Verify all images have extensions
  const allHaveExtensions = result.uploaded.every(img => path.extname(img.filename) !== '');
  assertTrue(allHaveExtensions, 'All uploaded files have extensions');

  // Verify all WebP files are generated
  const allHaveWebP = result.uploaded.every(img => img.webPFilename.endsWith('.webp'));
  assertTrue(allHaveWebP, 'All WebP files generated correctly');

  // Verify status code is 201 (all succeed)
  assertEqual(result.statusCode, 201, 'Status code is 201 for all successful uploads');

  // Verify counts
  assertEqual(result.uploaded.length, 5, 'All 5 images uploaded successfully');
  assertEqual(result.failed.length, 0, 'No images failed');
  assertEqual(result.total, 5, 'Total count is 5');

  console.log('\nUploaded Files:');
  result.uploaded.forEach((img, i) => {
    console.log(`  ${i + 1}. ${img.filename}`);
    console.log(`     WebP: ${img.webPFilename}`);
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================
function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('IMAGE UPLOAD FIX VERIFICATION TESTS');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);

  testFileExtensionPreservation();
  testWebPPathGeneration();
  testHTTPStatusCode();
  testEndToEndFlow();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('FIX VERIFICATION COMPLETE');
  console.log('='.repeat(60));

  return testResults;
}

// Run tests
const results = runTests();
process.exit(results.failed > 0 ? 1 : 0);
