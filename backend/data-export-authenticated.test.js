/**
 * Authenticated Data Export Testing Script
 *
 * This script tests all data export endpoints with proper authentication
 * to verify the partial/failed fixes from the previous test report.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials
const TEST_USER = {
  email: 'test.dataexport@example.com',
  password: 'SecureP@ssw0rd!2024',
  phone: '01987654321',
  firstName: 'Test',
  lastName: 'DataExport'
};

// Test results storage
const testResults = {
  userCreation: null,
  login: null,
  tests: []
};

/**
 * Log test result
 */
function logTest(category, testName, passed, details = '') {
  const result = {
    category,
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.tests.push(result);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${testName}`);
  if (details) {
    console.log(`    Details: ${details}`);
  }
}

/**
 * Create or get test user
 */
async function createTestUser() {
  console.log('\n=== Step 1: Creating Test User ===\n');
  
  try {
    // Check if user already exists by email
    let user = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });
    
    if (user) {
      console.log('✓ Test user already exists:', user.email);
      console.log('  User ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Phone:', user.phone);
      
      testResults.userCreation = {
        success: true,
        message: 'User already exists',
        userId: user.id
      };
      return user;
    }
    
    // Check if user exists by phone
    user = await prisma.user.findUnique({
      where: { phone: TEST_USER.phone }
    });
    
    if (user) {
      console.log('✓ Test user found by phone:', user.email);
      console.log('  User ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Phone:', user.phone);
      
      testResults.userCreation = {
        success: true,
        message: 'User found by phone',
        userId: user.id
      };
      return user;
    }
    
    // User doesn't exist, try to register via API
    console.log('User not found, attempting to register...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        confirmPassword: TEST_USER.password,
        phone: TEST_USER.phone,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName
      });
      
      if (response.data.success) {
        console.log('✓ Test user created successfully via registration API:', TEST_USER.email);
        console.log('  User ID:', response.data.data.user.id);
        console.log('  Email:', TEST_USER.email);
        console.log('  Phone:', TEST_USER.phone);
        
        testResults.userCreation = {
          success: true,
          message: 'User created successfully via registration API',
          userId: response.data.data.user.id
        };
        
        return response.data.data.user;
      } else {
        throw new Error('Registration response not successful');
      }
    } catch (regError) {
      console.error('✗ Registration API failed:', regError.message);
      if (regError.response) {
        console.error('  Response:', JSON.stringify(regError.response.data, null, 2));
      }
      throw new Error(`Failed to register user: ${regError.message}`);
    }
    
  } catch (error) {
    console.error('✗ Failed to create test user:', error.message);
    testResults.userCreation = {
      success: false,
      message: error.message
    };
    throw error;
  }
}

/**
 * Login to get JWT token
 */
async function loginAndGetToken(userEmail) {
  console.log('\n=== Step 2: Logging In to Get JWT Token ===\n');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: userEmail,
      password: TEST_USER.password
    });
    
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      const token = response.data.token;
      const userId = response.data.user.id;
      
      console.log('✓ Login successful');
      console.log('  User ID:', userId);
      console.log('  Email:', userEmail);
      console.log('  Token:', token.substring(0, 50) + '...');
      
      testResults.login = {
        success: true,
        userId,
        token
      };
      
      return { token, userId };
    } else {
      throw new Error('Login response missing token');
    }
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    testResults.login = {
      success: false,
      message: error.message
    };
    throw error;
  }
}

/**
 * Test 1: Get Data Exports (with authentication)
 */
async function testGetDataExports(token) {
  console.log('\n=== Test 1: GET /api/v1/profile/data/export ===\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verify response structure
    const hasSuccess = response.data.success === true;
    const hasExports = response.data.data && Array.isArray(response.data.data.exports);
    const noUndefinedError = !JSON.stringify(response.data).includes('undefined');
    
    logTest('Data Export', 'Get data exports returns 200 OK', response.status === 200);
    logTest('Data Export', 'Exports array is properly handled', hasExports);
    logTest('Data Export', 'No "exportItem is undefined" error', noUndefinedError);
    
    return response.data;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    logTest('Data Export', 'Get data exports returns 200 OK', false, error.message);
    logTest('Data Export', 'Exports array is properly handled', false, error.message);
    logTest('Data Export', 'No "exportItem is undefined" error', false, error.message);
    throw error;
  }
}

/**
 * Test 2: Create Data Export Request (with authentication)
 */
async function testCreateDataExport(token) {
  console.log('\n=== Test 2: POST /api/v1/profile/data/export/generate ===\n');
  
  try {
    const requestBody = {
      dataTypes: ['profile', 'orders', 'addresses'],
      format: 'csv'
    };
    
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/profile/data/export/generate`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verify response structure
    const hasSuccess = response.data.success === true;
    const hasExportId = response.data.data && response.data.data.exportId !== undefined;
    const hasStatus = response.data.data && response.data.data.status !== undefined;
    const hasExportToken = response.data.data && response.data.data.exportToken !== undefined;
    
    logTest('Data Export', 'Create export request returns 200 OK', response.status === 200);
    logTest('Data Export', 'Export request has exportId', hasExportId);
    logTest('Data Export', 'Export request has status', hasStatus);
    logTest('Data Export', 'Export request has exportToken', hasExportToken);
    
    if (hasExportId) {
      return response.data.data.exportId;
    }
    
    return null;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    logTest('Data Export', 'Create export request returns 200 OK', false, error.message);
    logTest('Data Export', 'Export request has exportId', false, error.message);
    logTest('Data Export', 'Export request has status', false, error.message);
    logTest('Data Export', 'Export request has exportToken', false, error.message);
    throw error;
  }
}

/**
 * Test 3: Download Data Export (with authentication)
 */
async function testDownloadDataExport(token, exportId) {
  console.log('\n=== Test 3: GET /api/v1/profile/data/export/:exportId ===\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verify response structure
    const hasSuccess = response.data.success === true;
    const hasDownloadUrl = response.data.data && response.data.data.downloadUrl !== undefined;
    const hasExpiresAt = response.data.data && response.data.data.expiresAt !== undefined;
    
    logTest('Data Export', 'Download export returns 200 OK', response.status === 200);
    logTest('Data Export', 'Download URL is provided', hasDownloadUrl);
    logTest('Data Export', 'Expires at is provided', hasExpiresAt);
    
    return response.data;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    logTest('Data Export', 'Download export returns 200 OK', false, error.message);
    logTest('Data Export', 'Download URL is provided', false, error.message);
    logTest('Data Export', 'Expires at is provided', false, error.message);
    throw error;
  }
}

/**
 * Test 4: Verify CSV Generation (with authentication)
 */
async function testCSVGeneration(token, exportId) {
  console.log('\n=== Test 4: Verify CSV Generation ===\n');
  
  try {
    // Wait a bit for the export to be processed
    console.log('Waiting 3 seconds for export to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check export status
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verify CSV generation
    const hasDownloadUrl = response.data.data && response.data.data.downloadUrl !== undefined;
    const downloadUrl = response.data.data?.downloadUrl || '';
    const isCsvFile = downloadUrl.includes('.csv');
    const noResUndefinedError = !JSON.stringify(response.data).includes('res is not defined');
    
    logTest('Data Export', 'CSV file is generated correctly', isCsvFile);
    logTest('Data Export', 'No "res is not defined" error', noResUndefinedError);
    
    if (isCsvFile) {
      console.log('✓ CSV file generated:', downloadUrl);
    }
    
    return response.data;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    logTest('Data Export', 'CSV file is generated correctly', false, error.message);
    logTest('Data Export', 'No "res is not defined" error', false, error.message);
    throw error;
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n\n=== COMPREHENSIVE TEST REPORT ===\n');
  
  // Summary
  const totalTests = testResults.tests.length;
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(2);
  
  console.log('Test Summary:');
  console.log('------------');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${successRate}%`);
  
  // User Creation
  console.log('\n\nUser Creation:');
  console.log('---------------');
  if (testResults.userCreation) {
    console.log(`Status: ${testResults.userCreation.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Message: ${testResults.userCreation.message}`);
    if (testResults.userCreation.userId) {
      console.log(`User ID: ${testResults.userCreation.userId}`);
    }
  } else {
    console.log('Status: ❌ NOT ATTEMPTED');
  }
  
  // Login
  console.log('\n\nLogin:');
  console.log('-------');
  if (testResults.login) {
    console.log(`Status: ${testResults.login.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (testResults.login.success) {
      console.log(`User ID: ${testResults.login.userId}`);
      console.log(`Token: ${testResults.login.token.substring(0, 50)}...`);
    } else {
      console.log(`Message: ${testResults.login.message}`);
    }
  } else {
    console.log('Status: ❌ NOT ATTEMPTED');
  }
  
  // Test Results by Category
  console.log('\n\nTest Results by Category:');
  console.log('------------------------');
  
  const categories = [...new Set(testResults.tests.map(t => t.category))];
  
  categories.forEach(category => {
    console.log(`\n${category}:`);
    console.log('-'.repeat(category.length + 1));
    
    const categoryTests = testResults.tests.filter(t => t.category === category);
    const table = categoryTests.map(t => {
      return {
        'Test Name': t.testName,
        'Status': t.passed ? '✅ PASS' : '❌ FAIL',
        'Details': t.details || ''
      };
    });
    
    console.table(table);
  });
  
  // Verification of Fixes
  console.log('\n\nVerification of Partial/Failed Fixes:');
  console.log('------------------------------------');
  
  const fix1Tests = testResults.tests.filter(t => 
    t.testName.includes('Get data exports') || 
    t.testName.includes('Exports array') ||
    t.testName.includes('exportItem is undefined')
  );
  
  const fix1Passed = fix1Tests.every(t => t.passed);
  console.log(`\n1. Data Export Null Checks: ${fix1Passed ? '✅ FULLY VERIFIED' : '❌ FAILED'}`);
  
  const fix2Tests = testResults.tests.filter(t => 
    t.testName.includes('Create export request') ||
    t.testName.includes('Download export')
  );
  
  const fix2Passed = fix2Tests.every(t => t.passed);
  console.log(`2. Data Export Download Functionality: ${fix2Passed ? '✅ FULLY VERIFIED' : '❌ FAILED'}`);
  
  const fix3Tests = testResults.tests.filter(t => 
    t.testName.includes('CSV file') ||
    t.testName.includes('res is not defined')
  );
  
  const fix3Passed = fix3Tests.every(t => t.passed);
  console.log(`3. Data Export CSV Generation: ${fix3Passed ? '✅ FULLY VERIFIED' : '❌ FAILED'}`);
  
  // Overall Status
  const allFixesVerified = fix1Passed && fix2Passed && fix3Passed;
  console.log(`\n\nOverall Status: ${allFixesVerified ? '✅ ALL FIXES FULLY VERIFIED' : '❌ SOME FIXES FAILED'}`);
  
  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate
    },
    userCreation: testResults.userCreation,
    login: testResults.login,
    tests: testResults.tests,
    fixes: {
      dataExportNullChecks: fix1Passed,
      dataExportDownloadFunctionality: fix2Passed,
      dataExportCSVGeneration: fix3Passed,
      allVerified: allFixesVerified
    }
  };
}

/**
 * Save test report to file
 */
async function saveTestReport(report) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `DATA_EXPORT_AUTHENTICATED_TEST_REPORT-${timestamp}.json`;
  const filepath = path.join(__dirname, filename);
  
  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n\n✓ Test report saved to: ${filename}`);
  
  // Also save a markdown version
  const mdFilename = `DATA_EXPORT_AUTHENTICATED_TEST_REPORT-${timestamp}.md`;
  const mdFilepath = path.join(__dirname, mdFilename);
  
  let mdContent = `# Data Export Authenticated Test Report\n\n`;
  mdContent += `**Generated:** ${new Date().toISOString()}\n\n`;
  mdContent += `## Test Summary\n\n`;
  mdContent += `- **Total Tests:** ${report.summary.totalTests}\n`;
  mdContent += `- **Passed:** ${report.summary.passedTests}\n`;
  mdContent += `- **Failed:** ${report.summary.failedTests}\n`;
  mdContent += `- **Success Rate:** ${report.summary.successRate}%\n\n`;
  
  mdContent += `## User Creation\n\n`;
  mdContent += `- **Status:** ${report.userCreation.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
  mdContent += `- **Message:** ${report.userCreation.message}\n`;
  if (report.userCreation.userId) {
    mdContent += `- **User ID:** ${report.userCreation.userId}\n`;
  }
  mdContent += `\n`;
  
  mdContent += `## Login\n\n`;
  if (report.login) {
    mdContent += `- **Status:** ${report.login.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    if (report.login.success) {
      mdContent += `- **User ID:** ${report.login.userId}\n`;
      mdContent += `- **Token:** ${report.login.token.substring(0, 50)}...\n`;
    } else {
      mdContent += `- **Message:** ${report.login.message}\n`;
    }
  } else {
    mdContent += `- **Status:** ❌ NOT ATTEMPTED\n`;
  }
  mdContent += `\n`;
  
  mdContent += `## Verification of Partial/Failed Fixes\n\n`;
  mdContent += `| Fix | Status |\n`;
  mdContent += `|-----|--------|\n`;
  mdContent += `| Data Export Null Checks | ${report.fixes.dataExportNullChecks ? '✅ FULLY VERIFIED' : '❌ FAILED'} |\n`;
  mdContent += `| Data Export Download Functionality | ${report.fixes.dataExportDownloadFunctionality ? '✅ FULLY VERIFIED' : '❌ FAILED'} |\n`;
  mdContent += `| Data Export CSV Generation | ${report.fixes.dataExportCSVGeneration ? '✅ FULLY VERIFIED' : '❌ FAILED'} |\n`;
  mdContent += `\n`;
  
  mdContent += `## Overall Status\n\n`;
  mdContent += `${report.fixes.allVerified ? '✅ ALL FIXES FULLY VERIFIED' : '❌ SOME FIXES FAILED'}\n\n`;
  
  mdContent += `## Detailed Test Results\n\n`;
  
  const categories = [...new Set(report.tests.map(t => t.category))];
  categories.forEach(category => {
    mdContent += `### ${category}\n\n`;
    mdContent += `| Test Name | Status | Details |\n`;
    mdContent += `|-----------|--------|---------|\n`;
    
    const categoryTests = report.tests.filter(t => t.category === category);
    categoryTests.forEach(t => {
      mdContent += `| ${t.testName} | ${t.passed ? '✅ PASS' : '❌ FAIL'} | ${t.details || ''} |\n`;
    });
    mdContent += `\n`;
  });
  
  await fs.writeFile(mdFilepath, mdContent, 'utf8');
  console.log(`✓ Test report (Markdown) saved to: ${mdFilename}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('  Data Export Authenticated Test Suite  ');
  console.log('========================================');
  console.log('Testing with proper authentication to verify partial/failed fixes');
  console.log('API Base URL:', API_BASE_URL);
  
  let token = null;
  let exportId = null;
  
  try {
    // Step 1: Create test user
    const user = await createTestUser();
    
    if (!user) {
      throw new Error('Failed to create or retrieve test user');
    }
    
    // Step 2: Login to get JWT token
    const loginResult = await loginAndGetToken(user.email);
    token = loginResult.token;
    
    // Step 3: Test GET /api/v1/profile/data/export
    await testGetDataExports(token);
    
    // Step 4: Test POST /api/v1/profile/data/export/generate
    exportId = await testCreateDataExport(token);
    
    // Step 5: Test GET /api/v1/profile/data/export/:exportId
    if (exportId) {
      await testDownloadDataExport(token, exportId);
      
      // Step 6: Verify CSV generation
      await testCSVGeneration(token, exportId);
    } else {
      console.log('\n⚠️  Skipping download and CSV tests - export ID not available');
    }
    
    // Generate and save test report
    const report = generateTestReport();
    await saveTestReport(report);
    
    console.log('\n\n========================================');
    console.log('  Test Suite Completed  ');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n\n✗ Test suite failed:', error.message);
    console.error(error.stack);
    
    // Still generate report even if tests failed
    const report = generateTestReport();
    await saveTestReport(report);
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test suite
main();
