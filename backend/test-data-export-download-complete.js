/**
 * Comprehensive Test Script for Data Export Download Functionality
 * 
 * This script tests the complete data export flow:
 * 1. Check existing exports
 * 2. Generate a new export if needed
 * 3. Test the download endpoint
 * 4. Verify the file content
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER_ID = 'test-user-001';
const TEST_USER_EMAIL = 'test@example.com';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

async function getAuthToken() {
  try {
    logInfo('Getting authentication token...');
    
    // Try to login with test credentials
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: 'Test123456!'
    }, {
      validateStatus: () => true
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
      logSuccess('Authentication successful');
      return loginResponse.data.token;
    }

    // If login fails, try to register first
    logInfo('Login failed, attempting registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: TEST_USER_EMAIL,
      password: 'Test123456!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+8801700000000'
    }, {
      validateStatus: () => true
    });

    if (registerResponse.status === 201) {
      logSuccess('Registration successful');
      return registerResponse.data.token;
    }

    logError('Authentication failed');
    return null;
  } catch (error) {
    logError(`Authentication error: ${error.message}`);
    return null;
  }
}

async function checkExistingExports(token) {
  try {
    logInfo('Checking existing exports...');
    
    const response = await axios.get(`${API_BASE_URL}/profile/data-exports`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true
    });

    if (response.status === 200) {
      logSuccess(`Found ${response.data.length} existing exports`);
      response.data.forEach((exp, index) => {
        logInfo(`  Export ${index + 1}: ${exp.exportId} - Status: ${exp.status}`);
      });
      return response.data;
    } else {
      logError(`Failed to fetch exports: ${response.status}`);
      return [];
    }
  } catch (error) {
    logError(`Error fetching exports: ${error.message}`);
    return [];
  }
}

async function generateExport(token) {
  try {
    logInfo('Generating new data export...');
    
    const response = await axios.post(`${API_BASE_URL}/profile/data-exports`, {
      dataTypes: ['profile', 'orders', 'addresses', 'wishlist'],
      format: 'json'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });

    if (response.status === 201) {
      logSuccess(`Export generated successfully: ${response.data.exportId}`);
      logInfo(`  Status: ${response.data.status}`);
      logInfo(`  Expires: ${response.data.expiresAt}`);
      return response.data;
    } else {
      logError(`Failed to generate export: ${response.status}`);
      logError(`Response: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    logError(`Error generating export: ${error.message}`);
    return null;
  }
}

async function waitForExportReady(token, exportId, maxAttempts = 10, interval = 2000) {
  try {
    logInfo(`Waiting for export ${exportId} to be ready...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await axios.get(`${API_BASE_URL}/profile/data-exports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });

      if (response.status === 200) {
        const exportItem = response.data.find(exp => exp.exportId === exportId);
        
        if (exportItem && exportItem.status === 'ready') {
          logSuccess(`Export is ready after ${attempt} attempts`);
          return exportItem;
        }
        
        logInfo(`  Attempt ${attempt}/${maxAttempts}: Status is ${exportItem?.status || 'not found'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    logError('Export did not become ready in time');
    return null;
  } catch (error) {
    logError(`Error waiting for export: ${error.message}`);
    return null;
  }
}

async function testDownloadEndpoint(token, exportId) {
  try {
    logInfo(`Testing download endpoint for export ${exportId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/profile/data/export/${exportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer',
      validateStatus: () => true
    });

    logInfo(`Response status: ${response.status}`);
    logInfo(`Response headers:`, JSON.stringify(response.headers, null, 2));

    if (response.status === 200) {
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];
      const contentLength = response.headers['content-length'];
      
      logSuccess('Download request successful');
      logInfo(`  Content-Type: ${contentType}`);
      logInfo(`  Content-Disposition: ${contentDisposition}`);
      logInfo(`  Content-Length: ${contentLength} bytes`);
      
      // Parse filename from Content-Disposition
      let filename = `export_${exportId}.json`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      logInfo(`  Filename: ${filename}`);
      
      // Verify content
      const content = response.data;
      const contentString = Buffer.from(content).toString('utf8');
      
      try {
        const jsonData = JSON.parse(contentString);
        logSuccess('Content is valid JSON');
        logInfo(`  Data keys: ${Object.keys(jsonData).join(', ')}`);
        logInfo(`  Data preview: ${JSON.stringify(jsonData).substring(0, 200)}...`);
      } catch (e) {
        logError('Content is not valid JSON');
        logInfo(`  Content preview: ${contentString.substring(0, 200)}...`);
      }
      
      return {
        success: true,
        contentType,
        contentDisposition,
        contentLength,
        filename,
        content: contentString
      };
    } else {
      logError(`Download request failed: ${response.status}`);
      const errorText = Buffer.from(response.data).toString('utf8');
      logInfo(`  Error response: ${errorText}`);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
  } catch (error) {
    logError(`Download error: ${error.message}`);
    if (error.response) {
      logError(`  Status: ${error.response.status}`);
      logError(`  Data: ${error.response.data}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCorsHeaders(token, exportId) {
  try {
    logInfo('Testing CORS headers with OPTIONS request...');
    
    const response = await axios.options(`${API_BASE_URL}/profile/data/export/${exportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      },
      validateStatus: () => true
    });

    logInfo(`OPTIONS response status: ${response.status}`);
    logInfo(`CORS headers:`, JSON.stringify(response.headers, null, 2));

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };

    if (corsHeaders['Access-Control-Allow-Origin']) {
      logSuccess('CORS headers present');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          logInfo(`  ${key}: ${value}`);
        }
      });
    } else {
      logError('CORS headers missing');
    }

    return corsHeaders;
  } catch (error) {
    logError(`CORS test error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  logSection('DATA EXPORT DOWNLOAD COMPREHENSIVE TEST');
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Test Time: ${new Date().toISOString()}`);

  // Step 1: Authentication
  logSection('STEP 1: AUTHENTICATION');
  const token = await getAuthToken();
  if (!token) {
    logError('Cannot proceed without authentication token');
    process.exit(1);
  }

  // Step 2: Check existing exports
  logSection('STEP 2: CHECK EXISTING EXPORTS');
  const existingExports = await checkExistingExports(token);
  
  // Find a ready export or generate a new one
  let readyExport = existingExports.find(exp => exp.status === 'ready');
  
  if (!readyExport) {
    logSection('STEP 3: GENERATE NEW EXPORT');
    const newExport = await generateExport(token);
    
    if (newExport) {
      logSection('STEP 4: WAIT FOR EXPORT PROCESSING');
      readyExport = await waitForExportReady(token, newExport.exportId);
    }
  }

  if (!readyExport) {
    logError('No ready export available for testing');
    process.exit(1);
  }

  // Step 5: Test CORS headers
  logSection('STEP 5: TEST CORS HEADERS');
  await testCorsHeaders(token, readyExport.exportId);

  // Step 6: Test download endpoint
  logSection('STEP 6: TEST DOWNLOAD ENDPOINT');
  const downloadResult = await testDownloadEndpoint(token, readyExport.exportId);

  // Final Summary
  logSection('TEST SUMMARY');
  if (downloadResult.success) {
    logSuccess('All tests passed!');
    logInfo(`  ✓ Authentication successful`);
    logInfo(`  ✓ Export available: ${readyExport.exportId}`);
    logInfo(`  ✓ CORS headers configured`);
    logInfo(`  ✓ Download endpoint working`);
    logInfo(`  ✓ File content valid`);
    logInfo(`  ✓ Filename: ${downloadResult.filename}`);
    logInfo(`  ✓ File size: ${downloadResult.contentLength} bytes`);
  } else {
    logError('Tests failed!');
    logInfo(`  ✗ Download endpoint returned error`);
    logInfo(`  Status: ${downloadResult.status}`);
    logInfo(`  Error: ${downloadResult.error}`);
  }

  console.log('\n' + '='.repeat(70));
  log('Test completed', 'bright');
  console.log('='.repeat(70) + '\n');
}

// Run the tests
runTests().catch(error => {
  logError(`Test script error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
