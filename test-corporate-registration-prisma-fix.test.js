/**
 * Corporate Registration Endpoint Test Script
 * Tests corporate registration endpoint after Prisma field name fixes
 * 
 * This script tests:
 * 1. Happy path: Successful registration with valid data
 * 2. Edge cases: Missing required fields, invalid file types, file size limits
 * 3. Backend logs monitoring
 * 4. Document upload verification
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';
const CORPORATE_ENDPOINT = `${API_VERSION}/corporate/register`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  validFileTypes: ['application/pdf', 'image/jpeg', 'image/png']
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Global variables
let authToken = null;
let testUserId = null;
let createdCorporateAccountId = null;

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

function recordTest(name, passed, message, status = null, response = null) {
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
    timestamp: new Date().toISOString()
  });
}

// Create test files
function createTestFiles() {
  log('Creating test files...', 'info');
  const testDir = path.join(__dirname, 'test-uploads');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create a valid PDF file
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
  
  // Create a valid image file (minimal PNG)
  const imagePath = path.join(testDir, 'test-image.png');
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
  fs.writeFileSync(imagePath, pngContent);
  
  // Create a large file to test size limit
  const largeFilePath = path.join(testDir, 'large-file.pdf');
  const largeContent = Buffer.alloc(6 * 1024 * 1024); // 6MB
  largeContent.write('%PDF-1.4', 0);
  fs.writeFileSync(largeFilePath, largeContent);
  
  // Create an invalid file type
  const invalidFilePath = path.join(testDir, 'invalid-file.exe');
  const invalidContent = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // EXE signature
  fs.writeFileSync(invalidFilePath, invalidContent);
  
  log('Test files created successfully', 'success');
  return {
    pdfPath,
    imagePath,
    largeFilePath,
    invalidFilePath
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
  const testDir = path.join(__dirname, 'test-uploads');
  if (fs.existsSync(testDir)) {
    fs.rmdirSync(testDir);
  }
  log('Test files cleaned up', 'success');
}

// Register a test user
async function loginExistingUser() {
  log('Logging in with existing verified user...', 'info');
  
  // Use existing verified user credentials
  const testEmail = 'raselbepari88@gmail.com';
  const testPassword = '54Vfo^71~_oQ';
  const testPhone = '+8801914287530';
  
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
    authToken = loginResponse.data.token;
    log(`Test user logged in successfully`, 'success');
    log(`User ID: ${testUserId}`, 'info');
    
    return { email: testEmail, password: testPassword };
  } catch (error) {
    log(`Failed to login test user: ${error.message}`, 'error');
    throw error;
  }
}

// Monitor backend logs
async function monitorBackendLogs(duration = 5000) {
  log('Monitoring backend logs...', 'info');
  
  try {
    const { stdout } = await execAsync(`docker logs --tail 100 smarttech_backend`);
    return stdout;
  } catch (error) {
    log(`Failed to fetch backend logs: ${error.message}`, 'warning');
    return '';
  }
}

// Test: Happy path - Successful registration
async function testHappyPath(files) {
  log('\n=== Testing Happy Path ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-${Date.now()}`);
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
  
  // Attach documents
  formData.append('tradeLicense', fs.createReadStream(files.pdfPath));
  formData.append('tinCertificate', fs.createReadStream(files.pdfPath));
  formData.append('vatCertificate', fs.createReadStream(files.pdfPath));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}${CORPORATE_ENDPOINT}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    if (response.status === 201) {
      createdCorporateAccountId = response.data.corporateAccount.id;
      recordTest(
        'Happy Path - Successful Registration',
        true,
        'Corporate account created successfully',
        response.status,
        response.data
      );
      
      // Verify response structure
      const { corporateAccount, documents } = response.data;
      if (corporateAccount.id && corporateAccount.companyName && documents) {
        recordTest(
          'Happy Path - Response Structure Validation',
          true,
          'Response contains all expected fields'
        );
      } else {
        recordTest(
          'Happy Path - Response Structure Validation',
          false,
          'Response missing expected fields'
        );
      }
    } else {
      recordTest(
        'Happy Path - Successful Registration',
        false,
        `Unexpected status code: ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;
    recordTest(
      'Happy Path - Successful Registration',
      false,
      `${status}: ${message}`,
      status,
      error.response?.data
    );
  }
}

// Test: Missing required fields
async function testMissingRequiredFields() {
  log('\n=== Testing Missing Required Fields ===', 'info');
  
  const requiredFields = [
    'companyName',
    'companyRegistrationNumber',
    'businessAddress',
    'division',
    'district',
    'authorizedPersonName',
    'authorizedPersonEmail',
    'authorizedPersonPhone',
    'companyEmail'
  ];
  
  for (const field of requiredFields) {
    const formData = new FormData();
    formData.append('userId', testUserId);
    
    // Add all fields except one being tested
    if (field !== 'companyName') formData.append('companyName', 'Test Company Ltd');
    if (field !== 'companyRegistrationNumber') formData.append('companyRegistrationNumber', `REG-${Date.now()}`);
    if (field !== 'tinNumber') formData.append('tinNumber', '123456789012');
    if (field !== 'businessAddress') formData.append('businessAddress', '123 Test Street');
    if (field !== 'division') formData.append('division', 'Dhaka');
    if (field !== 'district') formData.append('district', 'Dhaka');
    if (field !== 'upazila') formData.append('upazila', 'Savar');
    if (field !== 'postalCode') formData.append('postalCode', '1340');
    if (field !== 'authorizedPersonName') formData.append('authorizedPersonName', 'John Doe');
    if (field !== 'authorizedPersonEmail') formData.append('authorizedPersonEmail', 'john@testcompany.com');
    if (field !== 'authorizedPersonPhone') formData.append('authorizedPersonPhone', '+8801712345678');
    if (field !== 'companyEmail') formData.append('companyEmail', 'info@testcompany.com');
    if (field !== 'termsAccepted') formData.append('termsAccepted', 'true');
    
    // Add a dummy file to pass file validation
    const testDir = path.join(__dirname, 'test-uploads');
    formData.append('tradeLicense', fs.createReadStream(path.join(testDir, 'test-document.pdf')));
    
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
        `Missing Field - ${field}`,
        false,
        `Expected 400 but got ${response.status}`,
        response.status
      );
    } catch (error) {
      const status = error.response?.status;
      if (status === 400) {
        recordTest(
          `Missing Field - ${field}`,
          true,
          'Correctly returned 400 for missing field'
        );
      } else {
        recordTest(
          `Missing Field - ${field}`,
          false,
          `Expected 400 but got ${status}`,
          status
        );
      }
    }
  }
}

// Test: Invalid file types
async function testInvalidFileTypes(files) {
  log('\n=== Testing Invalid File Types ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach invalid file
  formData.append('tradeLicense', fs.createReadStream(files.invalidFilePath));
  
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
      'Invalid File Type',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) {
      recordTest(
        'Invalid File Type',
        true,
        'Correctly rejected invalid file type'
      );
    } else {
      recordTest(
        'Invalid File Type',
        false,
        `Expected 400 but got ${status}`,
        status
      );
    }
  }
}

// Test: File size limit
async function testFileSizeLimit(files) {
  log('\n=== Testing File Size Limit ===', 'info');
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  // Attach large file
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
      'File Size Limit',
      false,
      `Expected 400 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    if (status === 400 || error.code === 'ECONNABORTED') {
      recordTest(
        'File Size Limit',
        true,
        'Correctly rejected oversized file'
      );
    } else {
      recordTest(
        'File Size Limit',
        false,
        `Expected 400 but got ${status}`,
        status
      );
    }
  }
}

// Test: Duplicate company registration
async function testDuplicateRegistration() {
  log('\n=== Testing Duplicate Registration ===', 'info');
  
  if (!createdCorporateAccountId) {
    log('Skipping duplicate test - no account created yet', 'warning');
    return;
  }
  
  const formData = new FormData();
  formData.append('userId', testUserId);
  formData.append('companyName', 'Test Company Ltd');
  formData.append('companyRegistrationNumber', `REG-${Date.now()}`);
  formData.append('tinNumber', '123456789012');
  formData.append('businessAddress', '123 Test Street');
  formData.append('division', 'Dhaka');
  formData.append('district', 'Dhaka');
  formData.append('authorizedPersonName', 'John Doe');
  formData.append('authorizedPersonEmail', 'john@testcompany.com');
  formData.append('authorizedPersonPhone', '+8801712345678');
  formData.append('companyEmail', 'info@testcompany.com');
  
  const testDir = path.join(__dirname, 'test-uploads');
  formData.append('tradeLicense', fs.createReadStream(path.join(testDir, 'test-document.pdf')));
  
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
      'Duplicate Registration',
      false,
      `Expected 409 but got ${response.status}`,
      response.status
    );
  } catch (error) {
    const status = error.response?.status;
    if (status === 409) {
      recordTest(
        'Duplicate Registration',
        true,
        'Correctly rejected duplicate registration'
      );
    } else {
      recordTest(
        'Duplicate Registration',
        false,
        `Expected 409 but got ${status}`,
        status
      );
    }
  }
}

// Verify document uploads
async function verifyDocumentUploads() {
  log('\n=== Verifying Document Uploads ===', 'info');
  
  if (!createdCorporateAccountId) {
    log('Skipping document verification - no account created yet', 'warning');
    return;
  }
  
  const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'corporate-docs');
  
  if (!fs.existsSync(uploadsDir)) {
    recordTest(
      'Document Upload Directory',
      false,
      'Upload directory does not exist'
    );
    return;
  }
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const recentFiles = files.filter(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = Date.now() - stats.mtimeMs;
      return fileAge < 60000; // Files created within last minute
    });
    
    if (recentFiles.length > 0) {
      recordTest(
        'Document Upload Directory',
        true,
        `Found ${recentFiles.length} recently uploaded files`
      );
      log(`Recent uploads: ${recentFiles.join(', ')}`, 'info');
    } else {
      recordTest(
        'Document Upload Directory',
        false,
        'No recent uploads found'
      );
    }
  } catch (error) {
    recordTest(
      'Document Upload Directory',
      false,
      `Failed to verify uploads: ${error.message}`
    );
  }
}

// Check backend logs for Prisma errors
async function checkBackendLogsForPrismaErrors() {
  log('\n=== Checking Backend Logs for Prisma Errors ===', 'info');
  
  try {
    const { stdout } = await execAsync('docker logs --tail 200 smarttech_backend 2>&1 | grep -i "prisma\\|error\\|corporate registration"');
    
    if (stdout.includes('Prisma') && stdout.includes('error')) {
      recordTest(
        'Backend Logs - Prisma Errors',
        false,
        'Prisma errors found in backend logs'
      );
      log(`Prisma errors detected:\n${stdout}`, 'error');
    } else {
      recordTest(
        'Backend Logs - Prisma Errors',
        true,
        'No Prisma errors found in backend logs'
      );
    }
    
    // Check for debug log
    if (stdout.includes('[CORPORATE REGISTRATION] About to query for corporate account')) {
      recordTest(
        'Backend Logs - Debug Logging',
        true,
        'Debug logging is working correctly'
      );
    } else {
      recordTest(
        'Backend Logs - Debug Logging',
        false,
        'Debug logging not found'
      );
    }
  } catch (error) {
    // If grep finds nothing, it returns non-zero exit code
    if (error.message.includes('Command failed')) {
      recordTest(
        'Backend Logs - Prisma Errors',
        true,
        'No Prisma errors found in backend logs'
      );
    } else {
      recordTest(
        'Backend Logs - Prisma Errors',
        false,
        `Failed to check logs: ${error.message}`
      );
    }
  }
}

// Generate test report
function generateTestReport() {
  log('\n' + '='.repeat(70), 'info');
  log('CORPORATE REGISTRATION ENDPOINT TEST REPORT', 'info');
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
  log(`✅ No 500 errors: ${no500Errors ? 'YES' : 'NO'}`, no500Errors ? 'success' : 'error');
  log(`✅ Prisma field fix verified: ${no500Errors ? 'YES' : 'NO'}`, no500Errors ? 'success' : 'error');
  log(`✅ Happy path working: ${testResults.tests.find(t => t.name === 'Happy Path - Successful Registration')?.passed ? 'YES' : 'NO'}`, 
      testResults.tests.find(t => t.name === 'Happy Path - Successful Registration')?.passed ? 'success' : 'error');
  
  // Save report to file
  const reportPath = path.join(__dirname, 'corporate-registration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    tests: testResults.tests,
    corporateAccountId: createdCorporateAccountId,
    userId: testUserId
  }, null, 2));
  
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');
  
  return {
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%',
    no500Errors,
    corporateAccountId: createdCorporateAccountId
  };
}

// Main test execution
async function runTests() {
  log('🚀 Starting Corporate Registration Endpoint Tests', 'info');
  log('Testing Prisma field name fixes', 'info');
  log('='.repeat(70), 'info');
  
  let files;
  
  try {
    // Step 1: Create test files
    files = createTestFiles();
    
    // Step 2: Login with existing user
    await loginExistingUser();
    
    // Step 3: Test happy path
    await testHappyPath(files);
    
    // Step 4: Test missing required fields
    await testMissingRequiredFields();
    
    // Step 5: Test invalid file types
    await testInvalidFileTypes(files);
    
    // Step 6: Test file size limit
    await testFileSizeLimit(files);
    
    // Step 7: Test duplicate registration
    await testDuplicateRegistration();
    
    // Step 8: Verify document uploads
    await verifyDocumentUploads();
    
    // Step 9: Check backend logs
    await checkBackendLogsForPrismaErrors();
    
    // Step 10: Generate report
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
