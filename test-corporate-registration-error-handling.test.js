/**
 * Corporate Registration Endpoint Error Handling Test Script
 * Tests Multer error handling for file upload validation
 * 
 * This script specifically tests:
 * 1. Invalid file type errors - should return 400 status
 * 2. File size limit errors - should return 413 status
 * 3. Valid file types - should be accepted without file validation errors
 * 4. Multiple invalid files - should return 400 for each invalid file
 * 5. Missing required files - should return appropriate validation error
 * 
 * Key verification: Ensure NO 500 errors from file validation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';
const CORPORATE_ENDPOINT = `${API_VERSION}/corporate/register`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB (as configured in backend)
  validFileTypes: ['application/pdf', 'application/msword', 
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'image/jpeg', 'image/png', 'image/jpg', 'text/plain']
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Global variables
let testUserId = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  console.log(`${colors[type]}${prefix[type]} [${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, passed, message, status = null, response = null, errorDetails = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASSED: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAILED: ${name} - ${message}`, 'error');
  }
  
  testResults.tests.push({
    name,
    passed,
    message,
    status,
    response,
    errorDetails,
    timestamp: new Date().toISOString()
  });
}

// Create test files
function createTestFiles() {
  log('Creating test files...', 'info');
  const testDir = path.join(__dirname, 'test-uploads-error-handling');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // 1. Create a valid PDF file
  const pdfPath = path.join(testDir, 'test-document.pdf');
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Count 1
/Kids [3 0 R]
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;
  fs.writeFileSync(pdfPath, pdfContent);
  
  // 2. Create a valid JPG file
  const jpgPath = path.join(testDir, 'test-image.jpg');
  const jpgContent = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, // JPEG signature
    0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    0xFF, 0xDB, 0x00, 0x43, 0x00, 0x03, 0x02, 0x02,
    0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
    0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04,
    0x04, 0x05, 0x0A, 0x07, 0x07, 0x06, 0x08, 0x0C,
    0x0A, 0x0C, 0x0C, 0x0B, 0x0A, 0x0B, 0x0B, 0x0D,
    0x0E, 0x12, 0x10, 0x0D, 0x0E, 0x11, 0x0E, 0x0B,
    0x0B, 0x10, 0x16, 0x10, 0x11, 0x13, 0x14, 0x15,
    0x15, 0x15, 0x0C, 0x0F, 0x17, 0x18, 0x16, 0x14,
    0x18, 0x12, 0x14, 0x15, 0x14, 0xFF, 0xC0, 0x00,
    0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
    0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00,
    0x3F, 0x00, 0x37, 0xFF, 0xD9
  ]);
  fs.writeFileSync(jpgPath, jpgContent);
  
  // 3. Create a valid PNG file
  const pngPath = path.join(testDir, 'test-image.png');
  const pngContent = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR type
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB)
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT type
    0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
    0x0D, 0x0A, 0x2D, 0xB4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND type
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  fs.writeFileSync(pngPath, pngContent);
  
  // 4. Create a valid TXT file
  const txtPath = path.join(testDir, 'test-document.txt');
  const txtContent = 'This is a test document for corporate registration.\nIt contains plain text content.';
  fs.writeFileSync(txtPath, txtContent);
  
  // 5. Create a large file to test size limit (11MB - exceeds 10MB limit)
  const largeFilePath = path.join(testDir, 'large-file.pdf');
  const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
  largeContent.write('%PDF-1.4', 0);
  fs.writeFileSync(largeFilePath, largeContent);
  
  // 6. Create an invalid EXE file
  const exePath = path.join(testDir, 'invalid-file.exe');
  const exeContent = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // EXE signature
  fs.writeFileSync(exePath, exeContent);
  
  // 7. Create an invalid ZIP file
  const zipPath = path.join(testDir, 'invalid-file.zip');
  const zipContent = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // ZIP signature
  fs.writeFileSync(zipPath, zipContent);
  
  // 8. Create an invalid BAT file
  const batPath = path.join(testDir, 'invalid-file.bat');
  const batContent = Buffer.from('@echo off');
  fs.writeFileSync(batPath, batContent);
  
  log('Test files created successfully', 'success');
  return {
    pdfPath,
    jpgPath,
    pngPath,
    txtPath,
    largeFilePath,
    exePath,
    zipPath,
    batPath
  };
}

// Cleanup test files
function cleanupTestFiles(files) {
  log('Cleaning up test files...', 'info');
  Object.values(files).forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  const testDir = path.join(__dirname, 'test-uploads-error-handling');
  if (fs.existsSync(testDir)) {
    fs.rmdirSync(testDir);
  }
  log('Test files cleaned up', 'success');
}

// Login with existing user to get test user ID
async function loginExistingUser() {
  log('Logging in with existing verified user...', 'info');
  
  // Use existing verified user credentials
  const testEmail = 'raselbepari88@gmail.com';
  const testPassword = '54Vfo^71~_oQ';
  
  try {
    // Login to get auth token
    const loginResponse = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/login`, {
      identifier: testEmail,
      password: testPassword
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    testUserId = loginResponse.data.user.id;
    log(`Test user logged in successfully`, 'success');
    log(`User ID: ${testUserId}`, 'info');
    
    return { email: testEmail, password: testPassword };
  } catch (error) {
    log(`Failed to login test user: ${error.message}`, 'error');
    throw error;
  }
}

// Test 1: Invalid File Type - EXE
async function testInvalidFileTypeEXE(files) {
  log('\n=== Test 1: Invalid File Type - EXE ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-EXE-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('upazila', 'Savar');
  formData.append('postalCode', '1340');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  formData.append('termsAccepted', 'true');
  
  // Attach invalid EXE file
  formData.append('tradeLicense', fs.createReadStream(files.exePath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 1 - Invalid File Type (EXE)',
      false,
      `Expected 400 but got ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error (the main fix)
    if (status === 500) {
      recordTest(
        'Test 1 - Invalid File Type (EXE)',
        false,
        `CRITICAL: Got 500 status instead of 400 - Fix not working!`,
        status,
        data,
        { error: '500 error indicates Multer error fell through to global error handler' }
      );
      return;
    }
    
    // Verify it's 400 status
    if (status === 400) {
      // Verify error response structure
      const hasErrorField = data && data.error;
      const hasCodeField = data && data.code === 'INVALID_FILE_TYPE';
      const hasFieldField = data && data.field;
      
      if (hasErrorField && hasCodeField && hasFieldField) {
        recordTest(
          'Test 1 - Invalid File Type (EXE)',
          true,
          'Correctly returned 400 with proper error structure',
          status,
          data
        );
      } else {
        recordTest(
          'Test 1 - Invalid File Type (EXE)',
          false,
          'Status is 400 but error response structure is incomplete',
          status,
          data,
          { hasErrorField, hasCodeField, hasFieldField }
        );
      }
    } else {
      recordTest(
        'Test 1 - Invalid File Type (EXE)',
        false,
        `Expected 400 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 2: Invalid File Type - ZIP
async function testInvalidFileTypeZIP(files) {
  log('\n=== Test 2: Invalid File Type - ZIP ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-ZIP-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach invalid ZIP file
  formData.append('tradeLicense', fs.createReadStream(files.zipPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 2 - Invalid File Type (ZIP)',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error
    if (status === 500) {
      recordTest(
        'Test 2 - Invalid File Type (ZIP)',
        false,
        `CRITICAL: Got 500 status instead of 400 - Fix not working!`,
        status,
        data,
        { error: '500 error indicates Multer error fell through to global error handler' }
      );
      return;
    }
    
    if (status === 400) {
      recordTest(
        'Test 2 - Invalid File Type (ZIP)',
        true,
        'Correctly returned 400 for ZIP file',
        status,
        data
      );
    } else {
      recordTest(
        'Test 2 - Invalid File Type (ZIP)',
        false,
        `Expected 400 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 3: Invalid File Type - BAT
async function testInvalidFileTypeBAT(files) {
  log('\n=== Test 3: Invalid File Type - BAT ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-BAT-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach invalid BAT file
  formData.append('tradeLicense', fs.createReadStream(files.batPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 3 - Invalid File Type (BAT)',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error
    if (status === 500) {
      recordTest(
        'Test 3 - Invalid File Type (BAT)',
        false,
        `CRITICAL: Got 500 status instead of 400 - Fix not working!`,
        status,
        data,
        { error: '500 error indicates Multer error fell through to global error handler' }
      );
      return;
    }
    
    if (status === 400) {
      recordTest(
        'Test 3 - Invalid File Type (BAT)',
        true,
        'Correctly returned 400 for BAT file',
        status,
        data
      );
    } else {
      recordTest(
        'Test 3 - Invalid File Type (BAT)',
        false,
        `Expected 400 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 4: File Too Large (11MB exceeds 10MB limit)
async function testFileTooLarge(files) {
  log('\n=== Test 4: File Too Large ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-LARGE-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach large file (11MB)
  formData.append('tradeLicense', fs.createReadStream(files.largeFilePath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 4 - File Too Large',
      false,
      `Expected 413 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error
    if (status === 500) {
      recordTest(
        'Test 4 - File Too Large',
        false,
        `CRITICAL: Got 500 status instead of 413 - Fix not working!`,
        status,
        data,
        { error: '500 error indicates Multer error fell through to global error handler' }
      );
      return;
    }
    
    // Verify it's 413 status (Payload Too Large)
    if (status === 413) {
      // Verify error response structure
      const hasErrorField = data && data.error;
      const hasCodeField = data && data.code === 'LIMIT_FILE_SIZE';
      
      if (hasErrorField && hasCodeField) {
        recordTest(
          'Test 4 - File Too Large',
          true,
          'Correctly returned 413 with proper error structure',
          status,
          data
        );
      } else {
        recordTest(
          'Test 4 - File Too Large',
          false,
          'Status is 413 but error response structure is incomplete',
          status,
          data,
          { hasErrorField, hasCodeField }
        );
      }
    } else if (status === 400) {
      // Some configurations might return 400 instead of 413
      recordTest(
        'Test 4 - File Too Large',
        true,
        'Correctly rejected oversized file (returned 400 instead of 413)',
        status,
        data
      );
    } else {
      recordTest(
        'Test 4 - File Too Large',
        false,
        `Expected 413 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 5: Valid File Type - PDF
async function testValidFileTypePDF(files) {
  log('\n=== Test 5: Valid File Type - PDF ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-PDF-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('upazila', 'Savar');
  formData.append('postalCode', '1340');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  formData.append('termsAccepted', 'true');
  
  // Attach valid PDF file
  formData.append('tradeLicense', fs.createReadStream(files.pdfPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    // Note: This test may fail for other reasons (e.g., user already has corporate account),
    // but it should NOT fail due to file validation
    if (response.status === 201 || response.status === 400) {
      // Check if the error is NOT related to file validation
      if (response.status === 400 && response.data?.error?.includes('file')) {
        recordTest(
          'Test 5 - Valid File Type (PDF)',
          false,
          'Valid PDF file was rejected due to file validation',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 5 - Valid File Type (PDF)',
          true,
          `Valid PDF file accepted (status: ${response.status})`,
          response.status,
          response.data
        );
      }
    } else {
      recordTest(
        'Test 5 - Valid File Type (PDF)',
        false,
        `Unexpected status: ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error from file validation
    if (status === 500) {
      recordTest(
        'Test 5 - Valid File Type (PDF)',
        false,
        `CRITICAL: Got 500 status - File validation error!`,
        status,
        data,
        { error: '500 error indicates file validation failed' }
      );
      return;
    }
    
    // Check if error is related to file validation
    const isFileValidationError = data?.error?.toLowerCase().includes('file') ||
                             data?.error?.toLowerCase().includes('invalid') ||
                             data?.code === 'INVALID_FILE_TYPE';
    
    if (isFileValidationError) {
      recordTest(
        'Test 5 - Valid File Type (PDF)',
        false,
        'Valid PDF file was rejected due to file validation error',
        status,
        data
      );
    } else {
      // Error is not related to file validation (e.g., duplicate account, etc.)
      recordTest(
        'Test 5 - Valid File Type (PDF)',
        true,
        `Valid PDF file passed file validation (error: ${data?.error || 'other'})`,
        status,
        data
      );
    }
  }
}

// Test 6: Valid File Type - JPG
async function testValidFileTypeJPG(files) {
  log('\n=== Test 6: Valid File Type - JPG ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-JPG-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach valid JPG file
  formData.append('tradeLicense', fs.createReadStream(files.jpgPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    if (response.status === 201 || response.status === 400) {
      if (response.status === 400 && response.data?.error?.includes('file')) {
        recordTest(
          'Test 6 - Valid File Type (JPG)',
          false,
          'Valid JPG file was rejected due to file validation',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 6 - Valid File Type (JPG)',
          true,
          `Valid JPG file accepted (status: ${response.status})`,
          response.status,
          response.data
        );
      }
    } else {
      recordTest(
        'Test 6 - Valid File Type (JPG)',
        false,
        `Unexpected status: ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status === 500) {
      recordTest(
        'Test 6 - Valid File Type (JPG)',
        false,
        `CRITICAL: Got 500 status - File validation error!`,
        status,
        data
      );
      return;
    }
    
    const isFileValidationError = data?.error?.toLowerCase().includes('file') ||
                             data?.error?.toLowerCase().includes('invalid') ||
                             data?.code === 'INVALID_FILE_TYPE';
    
    if (isFileValidationError) {
      recordTest(
        'Test 6 - Valid File Type (JPG)',
        false,
        'Valid JPG file was rejected due to file validation error',
        status,
        data
      );
    } else {
      recordTest(
        'Test 6 - Valid File Type (JPG)',
        true,
        `Valid JPG file passed file validation (error: ${data?.error || 'other'})`,
        status,
        data
      );
    }
  }
}

// Test 7: Valid File Type - PNG
async function testValidFileTypePNG(files) {
  log('\n=== Test 7: Valid File Type - PNG ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-PNG-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach valid PNG file
  formData.append('tradeLicense', fs.createReadStream(files.pngPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    if (response.status === 201 || response.status === 400) {
      if (response.status === 400 && response.data?.error?.includes('file')) {
        recordTest(
          'Test 7 - Valid File Type (PNG)',
          false,
          'Valid PNG file was rejected due to file validation',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 7 - Valid File Type (PNG)',
          true,
          `Valid PNG file accepted (status: ${response.status})`,
          response.status,
          response.data
        );
      }
    } else {
      recordTest(
        'Test 7 - Valid File Type (PNG)',
        false,
        `Unexpected status: ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status === 500) {
      recordTest(
        'Test 7 - Valid File Type (PNG)',
        false,
        `CRITICAL: Got 500 status - File validation error!`,
        status,
        data
      );
      return;
    }
    
    const isFileValidationError = data?.error?.toLowerCase().includes('file') ||
                             data?.error?.toLowerCase().includes('invalid') ||
                             data?.code === 'INVALID_FILE_TYPE';
    
    if (isFileValidationError) {
      recordTest(
        'Test 7 - Valid File Type (PNG)',
        false,
        'Valid PNG file was rejected due to file validation error',
        status,
        data
      );
    } else {
      recordTest(
        'Test 7 - Valid File Type (PNG)',
        true,
        `Valid PNG file passed file validation (error: ${data?.error || 'other'})`,
        status,
        data
      );
    }
  }
}

// Test 8: Valid File Type - TXT
async function testValidFileTypeTXT(files) {
  log('\n=== Test 8: Valid File Type - TXT ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-TXT-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach valid TXT file
  formData.append('tradeLicense', fs.createReadStream(files.txtPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    if (response.status === 201 || response.status === 400) {
      if (response.status === 400 && response.data?.error?.includes('file')) {
        recordTest(
          'Test 8 - Valid File Type (TXT)',
          false,
          'Valid TXT file was rejected due to file validation',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 8 - Valid File Type (TXT)',
          true,
          `Valid TXT file accepted (status: ${response.status})`,
          response.status,
          response.data
        );
      }
    } else {
      recordTest(
        'Test 8 - Valid File Type (TXT)',
        false,
        `Unexpected status: ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status === 500) {
      recordTest(
        'Test 8 - Valid File Type (TXT)',
        false,
        `CRITICAL: Got 500 status - File validation error!`,
        status,
        data
      );
      return;
    }
    
    const isFileValidationError = data?.error?.toLowerCase().includes('file') ||
                             data?.error?.toLowerCase().includes('invalid') ||
                             data?.code === 'INVALID_FILE_TYPE';
    
    if (isFileValidationError) {
      recordTest(
        'Test 8 - Valid File Type (TXT)',
        false,
        'Valid TXT file was rejected due to file validation error',
        status,
        data
      );
    } else {
      recordTest(
        'Test 8 - Valid File Type (TXT)',
        true,
        `Valid TXT file passed file validation (error: ${data?.error || 'other'})`,
        status,
        data
      );
    }
  }
}

// Test 9: Multiple Invalid Files
async function testMultipleInvalidFiles(files) {
  log('\n=== Test 9: Multiple Invalid Files ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-MULTI-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach multiple invalid files
  formData.append('tradeLicense', fs.createReadStream(files.exePath));
  formData.append('tinCertificate', fs.createReadStream(files.zipPath));
  formData.append('vatCertificate', fs.createReadStream(files.batPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 9 - Multiple Invalid Files',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error
    if (status === 500) {
      recordTest(
        'Test 9 - Multiple Invalid Files',
        false,
        `CRITICAL: Got 500 status instead of 400 - Fix not working!`,
        status,
        data,
        { error: '500 error indicates Multer error fell through to global error handler' }
      );
      return;
    }
    
    if (status === 400) {
      recordTest(
        'Test 9 - Multiple Invalid Files',
        true,
        'Correctly returned 400 for multiple invalid files',
        status,
        data
      );
    } else {
      recordTest(
        'Test 9 - Multiple Invalid Files',
        false,
        `Expected 400 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 10: Missing Required Files
async function testMissingRequiredFiles() {
  log('\n=== Test 10: Missing Required Files ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-NOFILES-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street, Test Area');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Don't attach any files
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 10 - Missing Required Files',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Verify it's NOT a 500 error
    if (status === 500) {
      recordTest(
        'Test 10 - Missing Required Files',
        false,
        `CRITICAL: Got 500 status instead of 400 - Fix not working!`,
        status,
        data
      );
      return;
    }
    
    if (status === 400) {
      const hasErrorMessage = data && data.error;
      if (hasErrorMessage) {
        recordTest(
          'Test 10 - Missing Required Files',
          true,
          'Correctly returned 400 for missing files',
          status,
          data
        );
      } else {
        recordTest(
          'Test 10 - Missing Required Files',
          false,
          'Status is 400 but missing error message',
          status,
          data
        );
      }
    } else {
      recordTest(
        'Test 10 - Missing Required Files',
        false,
        `Expected 400 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Generate test report
function generateTestReport() {
  log('\n' + '='.repeat(70), 'info');
  log('CORPORATE REGISTRATION ERROR HANDLING TEST REPORT', 'info');
  log('='.repeat(70), 'info');
  
  log(`\nTotal Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.tests.filter(t => !t.passed).forEach((test, index) => {
      log(`${index + 1}. ${test.name}`, 'error');
      log(`   Status: ${test.status}`, 'info');
      log(`   Message: ${test.message}`, 'info');
      if (test.errorDetails) {
        log(`   Details: ${JSON.stringify(test.errorDetails, null, 2)}`, 'info');
      }
      if (test.response) {
        log(`   Response: ${JSON.stringify(test.response, null, 2)}`, 'info');
      }
      log('');
    });
  }
  
  log('\n✅ PASSED TESTS:', 'success');
  testResults.tests.filter(t => t.passed).forEach((test, index) => {
    log(`${index + 1}. ${test.name}`, 'success');
  });
  
  // Summary
  log('\n' + '='.repeat(70), 'info');
  log('SUMMARY', 'info');
  log('='.repeat(70), 'info');
  
  const no500Errors = !testResults.tests.some(t => t.status === 500);
  const allInvalidFilesRejected = testResults.tests
    .filter(t => t.name.includes('Invalid File Type'))
    .every(t => t.passed);
  const largeFileRejected = testResults.tests.find(t => t.name.includes('File Too Large'))?.passed;
  const validFilesAccepted = testResults.tests
    .filter(t => t.name.includes('Valid File Type'))
    .every(t => t.passed);
  
  log(`✅ No 500 errors from file validation: ${no500Errors ? 'YES' : 'NO'}`, no500Errors ? 'success' : 'error');
  log(`✅ All invalid file types rejected (400): ${allInvalidFilesRejected ? 'YES' : 'NO'}`, allInvalidFilesRejected ? 'success' : 'error');
  log(`✅ Large files rejected (413): ${largeFileRejected ? 'YES' : 'NO'}`, largeFileRejected ? 'success' : 'error');
  log(`✅ Valid file types accepted: ${validFilesAccepted ? 'YES' : 'NO'}`, validFilesAccepted ? 'success' : 'error');
  
  // Critical fix verification
  const fixWorking = no500Errors && allInvalidFilesRejected && largeFileRejected;
  log(`\n🎯 Multer Error Handling Fix Working: ${fixWorking ? 'YES ✅' : 'NO ❌'}`, fixWorking ? 'success' : 'error');
  
  // Save report to file
  const reportPath = path.join(__dirname, 'corporate-registration-error-handling-test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    fixVerification: {
      no500Errors,
      allInvalidFilesRejected,
      largeFileRejected,
      validFilesAccepted,
      fixWorking
    },
    tests: testResults.tests,
    userId: testUserId
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');
  
  return reportData;
}

// Main test execution
async function runTests() {
  log('🚀 Starting Corporate Registration Error Handling Tests', 'info');
  log('Testing Multer error handling fix for file upload validation', 'info');
  log('='.repeat(70), 'info');
  
  let files;
  
  try {
    // Step 1: Create test files
    files = createTestFiles();
    
    // Step 2: Login with existing user
    await loginExistingUser();
    
    // Step 3: Test invalid file types
    await testInvalidFileTypeEXE(files);
    await testInvalidFileTypeZIP(files);
    await testInvalidFileTypeBAT(files);
    
    // Step 4: Test file size limit
    await testFileTooLarge(files);
    
    // Step 5: Test valid file types
    await testValidFileTypePDF(files);
    await testValidFileTypeJPG(files);
    await testValidFileTypePNG(files);
    await testValidFileTypeTXT(files);
    
    // Step 6: Test multiple invalid files
    await testMultipleInvalidFiles(files);
    
    // Step 7: Test missing required files
    await testMissingRequiredFiles();
    
    // Step 8: Generate report
    const report = generateTestReport();
    
    // Cleanup
    cleanupTestFiles(files);
    
    log('\n🎉 All tests completed!', 'success');
    
    return report;
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'error');
    console.error(error);
    
    if (files) {
      cleanupTestFiles(files);
    }
    
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(report => {
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testResults,
  generateTestReport
};
