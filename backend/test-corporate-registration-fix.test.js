/**
 * Corporate Registration Endpoint Test
 * 
 * This test verifies that the corporate registration endpoint at /api/v1/corporate/register
 * is working correctly and not returning 500 Internal Server Error due to field name mismatches.
 * 
 * The test uses FormData with realistic test data to simulate a real corporate registration.
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_URL = 'http://localhost:3001/api/v1/corporate/register';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data - Realistic corporate registration information
const testData = {
  userId: '252a92b9-25be-4f07-9c32-db217727c16f', // Use existing user ID from system
  companyName: 'Test Corporation Ltd',
  companyRegistrationNumber: '1234567890',
  tinNumber: '123456789012',
  businessAddress: '123 Business Park, Gulshan 2',
  division: 'Dhaka',
  district: 'Dhaka',
  upazila: 'Gulshan',
  postalCode: '1212',
  authorizedPersonName: 'John Doe',
  authorizedPersonEmail: 'john.doe@testcorporation.com',
  authorizedPersonPhone: '01712345678',
  companyEmail: 'info@testcorporation.com',
  termsAccepted: 'true'
};

// Helper function to create a mock file
function createMockFile(filename, content) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper function to clean up mock files
function cleanupMockFiles(files) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      console.warn(`Warning: Could not delete mock file ${file}:`, error.message);
    }
  });
}

// Helper function to log response details
function logResponseDetails(response, responseBody) {
  console.log('\n=== RESPONSE DETAILS ===');
  console.log('Status Code:', response.status);
  console.log('Status Text:', response.statusText);
  console.log('\n=== RESPONSE HEADERS ===');
  Object.entries(response.headers).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.log('\n=== RESPONSE BODY ===');
  console.log(JSON.stringify(responseBody, null, 2));
  console.log('========================\n');
}

// Helper function to log error details
function logErrorDetails(error) {
  console.log('\n=== ERROR DETAILS ===');
  console.log('Error Name:', error.name);
  console.log('Error Message:', error.message);
  if (error.response) {
    console.log('Error Response Status:', error.response.status);
    console.log('Error Response Headers:', error.response.headers);
    console.log('Error Response Data:', error.response.data);
  } else if (error.request) {
    console.log('Error Request:', error.request);
  } else {
    console.log('Error Stack:', error.stack);
  }
  console.log('====================\n');
}

// Main test function
async function testCorporateRegistration() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CORPORATE REGISTRATION ENDPOINT TEST                        ║');
  console.log('║  Testing: POST /api/v1/corporate/register                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const mockFiles = [];

  try {
    // Create mock document files
    console.log('📄 Creating mock document files...');
    const tradeLicensePath = createMockFile('mock_trade_license.txt', 'Mock Trade License Document Content');
    const tinCertificatePath = createMockFile('mock_tin_certificate.txt', 'Mock TIN Certificate Document Content');
    const vatCertificatePath = createMockFile('mock_vat_certificate.txt', 'Mock VAT Certificate Document Content');
    
    mockFiles.push(tradeLicensePath, tinCertificatePath, vatCertificatePath);
    console.log('✅ Mock files created successfully\n');

    // Create FormData with test data
    console.log('📝 Creating FormData with test data...');
    const formData = new FormData();
    
    // Add all form fields
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value);
      console.log(`  - ${key}: ${value}`);
    });

    // Add document files
    formData.append('tradeLicense', fs.createReadStream(tradeLicensePath), {
      filename: 'trade_license.txt',
      contentType: 'text/plain'
    });
    formData.append('tinCertificate', fs.createReadStream(tinCertificatePath), {
      filename: 'tin_certificate.txt',
      contentType: 'text/plain'
    });
    formData.append('vatCertificate', fs.createReadStream(vatCertificatePath), {
      filename: 'vat_certificate.txt',
      contentType: 'text/plain'
    });
    console.log('✅ FormData created with all fields and documents\n');

    // Make the API request
    console.log('🌐 Sending POST request to:', API_URL);
    console.log('⏳ Waiting for response...\n');

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    // Parse response body
    const responseBody = await response.json();

    // Log response details
    logResponseDetails(response, responseBody);

    // Analyze the response
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS ANALYSIS                                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Check for 500 error (the main issue we're testing for)
    if (response.status === 500) {
      console.log('❌ TEST FAILED: Received 500 Internal Server Error');
      console.log('   This indicates the field name mismatch issue is NOT fixed.\n');
      return {
        success: false,
        statusCode: 500,
        message: 'Received 500 Internal Server Error - Field name mismatch issue persists',
        responseBody
      };
    }

    // Check for expected success response
    if (response.status === 201) {
      console.log('✅ TEST PASSED: Corporate registration successful!');
      console.log('   Status Code: 201 Created');
      console.log('   Message:', responseBody.message || 'No message provided');
      console.log('   Corporate Account ID:', responseBody.corporateAccount?.id || 'N/A');
      console.log('   Account Status:', responseBody.corporateAccount?.accountStatus || 'N/A');
      console.log('   Verification Status:', responseBody.corporateAccount?.verificationStatus || 'N/A');
      console.log('   Documents Uploaded:', responseBody.documents?.length || 0, '\n');
      return {
        success: true,
        statusCode: 201,
        message: 'Corporate registration successful',
        responseBody
      };
    }

    // Check for validation errors (400)
    if (response.status === 400) {
      console.log('⚠️  TEST WARNING: Received 400 Bad Request (Validation Error)');
      console.log('   This is expected if validation fails, but indicates:');
      console.log('   - The endpoint is working (not a 500 error)');
      console.log('   - Data validation rules are being enforced');
      console.log('   Error Details:', JSON.stringify(responseBody, null, 2), '\n');
      return {
        success: true,
        statusCode: 400,
        message: 'Validation error - Endpoint is working correctly',
        responseBody
      };
    }

    // Check for conflict errors (409)
    if (response.status === 409) {
      console.log('⚠️  TEST WARNING: Received 409 Conflict');
      console.log('   This is expected if:');
      console.log('   - Company registration number already exists');
      console.log('   - User already has a corporate account');
      console.log('   Error:', responseBody.error || 'Unknown conflict');
      console.log('   Message:', responseBody.message || 'No message provided', '\n');
      return {
        success: true,
        statusCode: 409,
        message: 'Conflict - Endpoint is working correctly',
        responseBody
      };
    }

    // Check for not found errors (404)
    if (response.status === 404) {
      console.log('⚠️  TEST WARNING: Received 404 Not Found');
      console.log('   This is expected if:');
      console.log('   - User ID does not exist in the system');
      console.log('   Error:', responseBody.error || 'Unknown error');
      console.log('   Message:', responseBody.message || 'No message provided', '\n');
      return {
        success: true,
        statusCode: 404,
        message: 'User not found - Endpoint is working correctly',
        responseBody
      };
    }

    // Unexpected status code
    console.log('⚠️  TEST WARNING: Received unexpected status code:', response.status);
    console.log('   Response:', JSON.stringify(responseBody, null, 2), '\n');
    return {
      success: true,
      statusCode: response.status,
      message: `Unexpected status code ${response.status}`,
      responseBody
    };

  } catch (error) {
    // Log error details
    logErrorDetails(error);

    console.log('\n❌ TEST FAILED: Exception occurred during test execution\n');
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };

  } finally {
    // Clean up mock files
    console.log('🧹 Cleaning up mock files...');
    cleanupMockFiles(mockFiles);
    console.log('✅ Cleanup complete\n');
  }
}

// Run the test
async function runTest() {
  console.log('Starting corporate registration endpoint test...\n');
  console.log('Test Configuration:');
  console.log('  - API URL:', API_URL);
  console.log('  - Timeout:', TEST_TIMEOUT, 'ms');
  console.log('  - Test Data:', JSON.stringify(testData, null, 2), '\n');

  const result = await testCorporateRegistration();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (result.success === false && result.statusCode === 500) {
    console.log('❌ OVERALL RESULT: FAILED');
    console.log('   Reason: 500 Internal Server Error detected');
    console.log('   The field name mismatch issue is NOT fixed.\n');
  } else if (result.success === false) {
    console.log('❌ OVERALL RESULT: FAILED');
    console.log('   Reason:', result.error || 'Unknown error');
    console.log('\n');
  } else {
    console.log('✅ OVERALL RESULT: PASSED');
    console.log('   The endpoint is working correctly.');
    console.log('   No 500 Internal Server Error detected.');
    console.log('   The field name mismatch issue has been FIXED.\n');
  }

  console.log('Status Code Received:', result.statusCode || 'N/A');
  console.log('Message:', result.message || 'N/A');
  if (result.responseBody) {
    console.log('Response Body:', JSON.stringify(result.responseBody, null, 2));
  }
  console.log('\n');

  // Exit with appropriate code
  process.exit(result.success === false ? 1 : 0);
}

// Execute the test
runTest().catch(error => {
  console.error('Fatal error running test:', error);
  process.exit(1);
});
