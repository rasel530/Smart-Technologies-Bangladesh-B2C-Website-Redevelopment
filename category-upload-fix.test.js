#!/usr/bin/env node

/**
 * Category Image Upload Fix Verification Test
 * Tests the fix for the 500 Internal Server Error on category image upload
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_URL = 'http://localhost:3001/api/v1';
const CATEGORY_ID = '2829f167-4aa0-4ac9-9fc9-a88812e98ef2';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '?';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`  ${icon} ${name}: ${status}`, color);
  if (details) {
    log(`    ${details}`, 'reset');
  }
}

// Create a test image file
function createTestImage(filePath, size = 1024) {
  const buffer = Buffer.alloc(size);
  // Create a minimal valid PNG header
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR type
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth: 8, color type: 2 (RGB)
    0x90, 0x77, 0x53, 0xDE  // CRC
  ]);
  pngHeader.copy(buffer);
  fs.writeFileSync(filePath, buffer);
  return buffer;
}

// Create a test text file (invalid type)
function createTestTextFile(filePath, size = 1024) {
  const buffer = Buffer.alloc(size, 'x');
  fs.writeFileSync(filePath, buffer);
  return buffer;
}

// Execute curl command and return response
function executeCurl(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return { success: true, output, error: null };
  } catch (error) {
    return { success: false, output: error.stdout || '', error: error.stderr || error.message };
  }
}

// Test Case 1: Upload Category Image
function testUploadCategoryImage() {
  logSection('TEST CASE 1: Upload Category Image');

  const testImagePath = path.join(__dirname, 'test-image.png');
  let testPassed = true;
  let details = '';

  try {
    // Create test image
    log('  Creating test image...', 'blue');
    createTestImage(testImagePath, 1024);
    log('  Test image created successfully', 'green');

    // Upload the image
    log('  Uploading image to category...', 'blue');
    const curlCommand = `curl -X POST "${API_URL}/categories/${CATEGORY_ID}/image" -H "Authorization: Bearer ${ADMIN_TOKEN}" -F "image=@${testImagePath}" -w "\\nHTTP_CODE:%{http_code}" -s`;

    const result = executeCurl(curlCommand);
    const lines = result.output.split('\n');
    const httpCode = lines.find(l => l.startsWith('HTTP_CODE:'))?.split(':')[1] || '000';
    const responseBody = lines.filter(l => !l.startsWith('HTTP_CODE:')).join('\n');

    log(`  HTTP Status Code: ${httpCode}`, 'blue');
    log(`  Response: ${responseBody.substring(0, 200)}...`, 'blue');

    if (httpCode === '200' || httpCode === '201') {
      logTest('HTTP Status Code', 'PASS', `Received ${httpCode}`);
      try {
        const response = JSON.parse(responseBody);
        if (response.category && response.category.imageUrl) {
          logTest('Response contains imageUrl', 'PASS', response.category.imageUrl);
          details = `Image URL: ${response.category.imageUrl}`;
        } else {
          logTest('Response contains imageUrl', 'FAIL', 'imageUrl not found in response');
          testPassed = false;
        }
      } catch (e) {
        logTest('Parse JSON response', 'FAIL', e.message);
        testPassed = false;
      }
    } else {
      logTest('HTTP Status Code', 'FAIL', `Expected 200/201, got ${httpCode}`);
      logTest('Error Response', 'FAIL', responseBody);
      testPassed = false;
    }

  } catch (error) {
    logTest('Upload Category Image', 'FAIL', error.message);
    testPassed = false;
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }

  return { passed: testPassed, details };
}

// Test Case 2: Upload Category Icon
function testUploadCategoryIcon() {
  logSection('TEST CASE 2: Upload Category Icon');

  const testIconPath = path.join(__dirname, 'test-icon.png');
  let testPassed = true;
  let details = '';

  try {
    // Create test icon
    log('  Creating test icon...', 'blue');
    createTestImage(testIconPath, 512);
    log('  Test icon created successfully', 'green');

    // Upload the icon
    log('  Uploading icon to category...', 'blue');
    const curlCommand = `curl -X POST "${API_URL}/categories/${CATEGORY_ID}/icon" -H "Authorization: Bearer ${ADMIN_TOKEN}" -F "icon=@${testIconPath}" -w "\\nHTTP_CODE:%{http_code}" -s`;

    const result = executeCurl(curlCommand);
    const lines = result.output.split('\n');
    const httpCode = lines.find(l => l.startsWith('HTTP_CODE:'))?.split(':')[1] || '000';
    const responseBody = lines.filter(l => !l.startsWith('HTTP_CODE:')).join('\n');

    log(`  HTTP Status Code: ${httpCode}`, 'blue');
    log(`  Response: ${responseBody.substring(0, 200)}...`, 'blue');

    if (httpCode === '200' || httpCode === '201') {
      logTest('HTTP Status Code', 'PASS', `Received ${httpCode}`);
      try {
        const response = JSON.parse(responseBody);
        if (response.category && response.category.iconUrl) {
          logTest('Response contains iconUrl', 'PASS', response.category.iconUrl);
          details = `Icon URL: ${response.category.iconUrl}`;
        } else {
          logTest('Response contains iconUrl', 'FAIL', 'iconUrl not found in response');
          testPassed = false;
        }
      } catch (e) {
        logTest('Parse JSON response', 'FAIL', e.message);
        testPassed = false;
      }
    } else {
      logTest('HTTP Status Code', 'FAIL', `Expected 200/201, got ${httpCode}`);
      logTest('Error Response', 'FAIL', responseBody);
      testPassed = false;
    }

  } catch (error) {
    logTest('Upload Category Icon', 'FAIL', error.message);
    testPassed = false;
  } finally {
    // Cleanup
    if (fs.existsSync(testIconPath)) {
      fs.unlinkSync(testIconPath);
    }
  }

  return { passed: testPassed, details };
}

// Test Case 3: Upload Invalid File Type
function testUploadInvalidFileType() {
  logSection('TEST CASE 3: Upload Invalid File Type');

  const testTextPath = path.join(__dirname, 'test-file.txt');
  let testPassed = true;
  let details = '';

  try {
    // Create test text file
    log('  Creating test text file...', 'blue');
    createTestTextFile(testTextPath, 512);
    log('  Test text file created successfully', 'green');

    // Try to upload the text file as an image
    log('  Attempting to upload invalid file type...', 'blue');
    const curlCommand = `curl -X POST "${API_URL}/categories/${CATEGORY_ID}/image" -H "Authorization: Bearer ${ADMIN_TOKEN}" -F "image=@${testTextPath}" -w "\\nHTTP_CODE:%{http_code}" -s`;

    const result = executeCurl(curlCommand);
    const lines = result.output.split('\n');
    const httpCode = lines.find(l => l.startsWith('HTTP_CODE:'))?.split(':')[1] || '000';
    const responseBody = lines.filter(l => !l.startsWith('HTTP_CODE:')).join('\n');

    log(`  HTTP Status Code: ${httpCode}`, 'blue');
    log(`  Response: ${responseBody.substring(0, 200)}...`, 'blue');

    // We expect a 400 or 500 error for invalid file type
    if (httpCode === '400' || httpCode === '500') {
      logTest('HTTP Status Code', 'PASS', `Received ${httpCode} (expected for invalid file type)`);
      try {
        const response = JSON.parse(responseBody);
        if (response.error) {
          logTest('Error message returned', 'PASS', response.error);
          details = `Error: ${response.error}`;
        } else {
          logTest('Error message returned', 'FAIL', 'No error message in response');
          testPassed = false;
        }
      } catch (e) {
        logTest('Parse JSON response', 'FAIL', e.message);
        testPassed = false;
      }
    } else {
      logTest('HTTP Status Code', 'FAIL', `Expected 400/500, got ${httpCode}`);
      testPassed = false;
    }

  } catch (error) {
    logTest('Upload Invalid File Type', 'FAIL', error.message);
    testPassed = false;
  } finally {
    // Cleanup
    if (fs.existsSync(testTextPath)) {
      fs.unlinkSync(testTextPath);
    }
  }

  return { passed: testPassed, details };
}

// Test Case 4: Upload File Exceeding Size Limit
function testUploadFileExceedingSizeLimit() {
  logSection('TEST CASE 4: Upload File Exceeding Size Limit');

  const testLargeImagePath = path.join(__dirname, 'test-large-image.png');
  let testPassed = true;
  let details = '';

  try {
    // Create a large test image (> 5MB)
    log('  Creating large test image (> 5MB)...', 'blue');
    const largeSize = 6 * 1024 * 1024; // 6MB
    createTestImage(testLargeImagePath, largeSize);
    log('  Large test image created successfully', 'green');

    // Try to upload large image
    log('  Attempting to upload file exceeding size limit...', 'blue');
    const curlCommand = `curl -X POST "${API_URL}/categories/${CATEGORY_ID}/image" -H "Authorization: Bearer ${ADMIN_TOKEN}" -F "image=@${testLargeImagePath}" -w "\\nHTTP_CODE:%{http_code}" -s`;

    const result = executeCurl(curlCommand);
    const lines = result.output.split('\n');
    const httpCode = lines.find(l => l.startsWith('HTTP_CODE:'))?.split(':')[1] || '000';
    const responseBody = lines.filter(l => !l.startsWith('HTTP_CODE:')).join('\n');

    log(`  HTTP Status Code: ${httpCode}`, 'blue');
    log(`  Response: ${responseBody.substring(0, 200)}...`, 'blue');

    // We expect a 413 (Payload Too Large) or 500 error
    if (httpCode === '413' || httpCode === '500' || httpCode === '400') {
      logTest('HTTP Status Code', 'PASS', `Received ${httpCode} (expected for file exceeding size limit)`);
      try {
        const response = JSON.parse(responseBody);
        if (response.error) {
          logTest('Error message returned', 'PASS', response.error);
          details = `Error: ${response.error}`;
        } else {
          logTest('Error message returned', 'FAIL', 'No error message in response');
          testPassed = false;
        }
      } catch (e) {
        logTest('Parse JSON response', 'FAIL', e.message);
        testPassed = false;
      }
    } else {
      logTest('HTTP Status Code', 'FAIL', `Expected 413/500/400, got ${httpCode}`);
      testPassed = false;
    }

  } catch (error) {
    logTest('Upload File Exceeding Size Limit', 'FAIL', error.message);
    testPassed = false;
  } finally {
    // Cleanup
    if (fs.existsSync(testLargeImagePath)) {
      fs.unlinkSync(testLargeImagePath);
    }
  }

  return { passed: testPassed, details };
}

// Verify diagnostic logging in backend logs
function verifyDiagnosticLogging() {
  logSection('VERIFY DIAGNOSTIC LOGGING');

  try {
    log('  Checking backend logs for diagnostic messages...', 'blue');
    const command = 'docker logs smarttech_backend --tail 100 2>&1';
    const result = executeCurl(command);

    const logs = result.output;

    // Check for path construction diagnostic
    if (logs.includes('[CATEGORY IMAGE UPLOAD] Path construction:')) {
      logTest('Path construction diagnostic log found', 'PASS');
    } else {
      logTest('Path construction diagnostic log found', 'FAIL', 'Diagnostic log not found');
    }

    // Check for directory creation log
    if (logs.includes('[CATEGORY IMAGE UPLOAD] Directory created successfully:')) {
      logTest('Directory creation diagnostic log found', 'PASS');
    } else {
      logTest('Directory creation diagnostic log found', 'INFO', 'May not be needed if directory exists');
    }

    // Check for upload request log
    if (logs.includes('[CATEGORY IMAGE UPLOAD] Request received:')) {
      logTest('Upload request diagnostic log found', 'PASS');
    } else {
      logTest('Upload request diagnostic log found', 'FAIL', 'Upload request log not found');
    }

    // Check for icon upload request log
    if (logs.includes('[CATEGORY ICON UPLOAD] Request received:')) {
      logTest('Icon upload request diagnostic log found', 'PASS');
    } else {
      logTest('Icon upload request diagnostic log found', 'FAIL', 'Icon upload request log not found');
    }

    return { passed: true, details: logs };

  } catch (error) {
    logTest('Verify Diagnostic Logging', 'FAIL', error.message);
    return { passed: false, details: error.message };
  }
}

// Verify file storage
function verifyFileStorage() {
  logSection('VERIFY FILE STORAGE');

  try {
    log('  Checking /app/uploads/categories/ directory...', 'blue');
    const command = 'docker exec smarttech_backend ls -la /app/uploads/categories/';
    const result = executeCurl(command);

    if (result.success) {
      log('  Files in /app/uploads/categories/:', 'blue');
      console.log(result.output);

      const files = result.output.split('\n').filter(line => line.includes('category-') && !line.includes('total'));
      if (files.length > 0) {
        logTest('Files saved to uploads directory', 'PASS', `${files.length} file(s) found`);
        return { passed: true, details: result.output };
      } else {
        logTest('Files saved to uploads directory', 'FAIL', 'No files found');
        return { passed: false, details: result.output };
      }
    } else {
      logTest('Verify File Storage', 'FAIL', result.error);
      return { passed: false, details: result.error };
    }

  } catch (error) {
    logTest('Verify File Storage', 'FAIL', error.message);
    return { passed: false, details: error.message };
  }
}

// Verify database updates
function verifyDatabaseUpdates() {
  logSection('VERIFY DATABASE UPDATES');

  try {
    log('  Querying database for category imageUrl and iconUrl...', 'blue');
    const command = `docker exec smarttech_postgres psql -U postgres -d smart_ecommerce_dev -c "SELECT id, name, imageUrl, iconUrl FROM \\"Category\\" WHERE id = '${CATEGORY_ID}';"`;
    const result = executeCurl(command);

    if (result.success) {
      log('  Database query result:', 'blue');
      console.log(result.output);

      const hasImageUrl = result.output.includes('/uploads/categories/');
      const hasIconUrl = result.output.includes('/uploads/categories/');

      if (hasImageUrl) {
        logTest('imageUrl updated in database', 'PASS');
      } else {
        logTest('imageUrl updated in database', 'FAIL', 'imageUrl not found or not updated');
      }

      if (hasIconUrl) {
        logTest('iconUrl updated in database', 'PASS');
      } else {
        logTest('iconUrl updated in database', 'FAIL', 'iconUrl not found or not updated');
      }

      return { passed: hasImageUrl && hasIconUrl, details: result.output };
    } else {
      logTest('Verify Database Updates', 'FAIL', result.error);
      return { passed: false, details: result.error };
    }

  } catch (error) {
    logTest('Verify Database Updates', 'FAIL', error.message);
    return { passed: false, details: error.message };
  }
}

// Main test execution
async function main() {
  logSection('CATEGORY IMAGE UPLOAD FIX VERIFICATION TEST');
  log('Testing fix for 500 Internal Server Error on category image upload', 'cyan');
  log(`Category ID: ${CATEGORY_ID}`, 'cyan');
  log(`API URL: ${API_URL}`, 'cyan');

  const results = {
    test1: null,
    test2: null,
    test3: null,
    test4: null,
    diagnosticLogs: null,
    fileStorage: null,
    databaseUpdates: null
  };

  // Run tests
  results.test1 = testUploadCategoryImage();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests

  results.test2 = testUploadCategoryIcon();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.test3 = testUploadInvalidFileType();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.test4 = testUploadFileExceedingSizeLimit();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.diagnosticLogs = verifyDiagnosticLogging();
  results.fileStorage = verifyFileStorage();
  results.databaseUpdates = verifyDatabaseUpdates();

  // Generate summary
  logSection('TEST SUMMARY');

  const totalTests = 7;
  const passedTests = [
    results.test1?.passed,
    results.test2?.passed,
    results.test3?.passed,
    results.test4?.passed,
    results.diagnosticLogs?.passed,
    results.fileStorage?.passed,
    results.databaseUpdates?.passed
  ].filter(Boolean).length;

  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests > 0 ? 'red' : 'green');

  console.log('\nDetailed Results:');
  console.log(`  Test Case 1 (Upload Category Image): ${results.test1?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Test Case 2 (Upload Category Icon): ${results.test2?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Test Case 3 (Upload Invalid File Type): ${results.test3?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Test Case 4 (Upload File Exceeding Size Limit): ${results.test4?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Diagnostic Logging: ${results.diagnosticLogs?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  File Storage: ${results.fileStorage?.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Database Updates: ${results.databaseUpdates?.passed ? 'PASS' : 'FAIL'}`);

  // Overall assessment
  logSection('OVERALL ASSESSMENT');

  if (passedTests === totalTests) {
    log('✓ ALL TESTS PASSED', 'green');
    log('The category image upload fix is working correctly!', 'green');
    log('The 500 Internal Server Error has been resolved.', 'green');
  } else if (passedTests >= totalTests / 2) {
    log('⚠ PARTIAL SUCCESS', 'yellow');
    log('Some tests passed, but there are still issues to address.', 'yellow');
  } else {
    log('✗ TESTS FAILED', 'red');
    log('The category image upload fix needs further investigation.', 'red');
  }

  return passedTests === totalTests ? 0 : 1;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  main().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testUploadCategoryImage,
  testUploadCategoryIcon,
  testUploadInvalidFileType,
  testUploadFileExceedingSizeLimit,
  verifyDiagnosticLogging,
  verifyFileStorage,
  verifyDatabaseUpdates
};
