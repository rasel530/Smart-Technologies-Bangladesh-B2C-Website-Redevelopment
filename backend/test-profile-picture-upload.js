/**
 * Profile Picture Upload Test Script
 * 
 * This script tests the profile picture upload functionality to verify
 * that the FormData handling fix works correctly.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const TEST_USER_IDENTIFIER = 'test@example.com'; // Can be email or phone
const TEST_USER_PASSWORD = 'Test123!';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.bright + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.bright + colors.blue + `  ${title}` + colors.reset);
  console.log(colors.bright + colors.blue + '='.repeat(60) + colors.reset + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.yellow);
}

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  const data = await response.json();
  return { response, data };
}

// Test 1: Login to get authentication token
async function testLogin() {
  logSection('Test 1: User Login');
  
  try {
    const { response, data } = await makeRequest('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER_IDENTIFIER,
        password: TEST_USER_PASSWORD
      })
    });

    if (response.ok && data.success && data.data.token) {
      logSuccess('Login successful');
      logInfo(`Token: ${data.data.token.substring(0, 20)}...`);
      return data.data.token;
    } else {
      logError('Login failed');
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return null;
  }
}

// Test 2: Create a test image file
async function createTestImage() {
  logSection('Test 2: Create Test Image');
  
  const testImagePath = path.join(__dirname, 'test-profile-image.jpg');
  
  // Create a simple 1x1 red pixel JPEG (minimal valid JPEG)
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
    0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0A, 0x07,
    0x07, 0x06, 0x08, 0x0C, 0x0A, 0x0C, 0x0C, 0x0B, 0x0A, 0x0B, 0x0B, 0x0D,
    0x0E, 0x12, 0x10, 0x0D, 0x0E, 0x11, 0x0E, 0x0B, 0x0B, 0x10, 0x16, 0x10,
    0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0C, 0x0F, 0x17, 0x18, 0x16, 0x14,
    0x18, 0x12, 0x14, 0x15, 0x14, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x0A, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
  ]);

  fs.writeFileSync(testImagePath, jpegData);
  logSuccess(`Test image created at: ${testImagePath}`);
  logInfo(`File size: ${jpegData.length} bytes`);
  
  return testImagePath;
}

// Test 3: Upload profile picture using FormData
async function testProfilePictureUpload(token, imagePath) {
  logSection('Test 3: Upload Profile Picture (FormData)');
  
  try {
    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('picture', fs.createReadStream(imagePath), 'test-profile.jpg');
    
    logInfo('FormData created with picture field');
    logInfo('Sending POST request to /profile/me/picture');
    
    const { response, data } = await makeRequest('/profile/me/picture', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (response.ok && data.success) {
      logSuccess('Profile picture uploaded successfully');
      logInfo(`User image: ${data.data.user.image}`);
      return data.data.user;
    } else {
      logError('Profile picture upload failed');
      logInfo(`Status: ${response.status}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Upload error: ${error.message}`);
    logInfo(`Stack: ${error.stack}`);
    return null;
  }
}

// Test 4: Verify profile picture is accessible
async function testProfilePictureAccess(user) {
  logSection('Test 4: Verify Profile Picture Accessibility');
  
  if (!user || !user.image) {
    logError('No image URL to test');
    return false;
  }

  try {
    const imageUrl = `${API_BASE_URL.replace('/api/v1', '')}${user.image}`;
    logInfo(`Attempting to access: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    
    if (response.ok) {
      logSuccess('Profile picture is accessible');
      logInfo(`Content-Type: ${response.headers.get('content-type')}`);
      logInfo(`Content-Length: ${response.headers.get('content-length')} bytes`);
      return true;
    } else {
      logError('Profile picture is not accessible');
      logInfo(`Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Access error: ${error.message}`);
    return false;
  }
}

// Test 5: Get user profile to verify image is saved
async function testGetProfile(token) {
  logSection('Test 5: Get User Profile');
  
  try {
    const { response, data } = await makeRequest('/profile/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok && data.success) {
      logSuccess('Profile retrieved successfully');
      logInfo(`User: ${data.data.user.firstName} ${data.data.user.lastName}`);
      logInfo(`Image: ${data.data.user.image || 'No image'}`);
      return data.data.user;
    } else {
      logError('Failed to get profile');
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Get profile error: ${error.message}`);
    return null;
  }
}

// Test 6: Delete profile picture
async function testDeleteProfilePicture(token) {
  logSection('Test 6: Delete Profile Picture');
  
  try {
    const { response, data } = await makeRequest('/profile/me/picture', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok && data.success) {
      logSuccess('Profile picture deleted successfully');
      logInfo(`User image: ${data.data.user.image || 'null'}`);
      return true;
    } else {
      logError('Failed to delete profile picture');
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Delete error: ${error.message}`);
    return false;
  }
}

// Cleanup function
function cleanup(testImagePath) {
  logSection('Cleanup');
  
  try {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      logSuccess('Test image file deleted');
    }
  } catch (error) {
    logError(`Cleanup error: ${error.message}`);
  }
}

// Main test execution
async function runTests() {
  console.log(colors.bright + colors.blue);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Profile Picture Upload Functionality Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  logInfo(`API URL: ${API_BASE_URL}`);
  logInfo(`Test User: ${TEST_USER_IDENTIFIER}`);
  
  const token = await testLogin();
  if (!token) {
    logError('Cannot proceed without authentication token');
    process.exit(1);
  }
  
  const testImagePath = await createTestImage();
  
  // Run tests
  const uploadedUser = await testProfilePictureUpload(token, testImagePath);
  
  if (uploadedUser) {
    await testProfilePictureAccess(uploadedUser);
    await testGetProfile(token);
  }
  
  // Test delete
  await testDeleteProfilePicture(token);
  
  // Verify deletion
  const profileAfterDelete = await testGetProfile(token);
  if (profileAfterDelete && !profileAfterDelete.image) {
    logSuccess('Profile picture successfully removed from database');
  }
  
  // Cleanup
  cleanup(testImagePath);
  
  // Summary
  logSection('Test Summary');
  logSuccess('All tests completed');
  logInfo('Please review the results above for any failures');
  
  console.log('\n');
}

// Check if form-data is installed
try {
  require('form-data');
  runTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
} catch (error) {
  logError('Missing required dependency: form-data');
  logInfo('Please install it with: npm install form-data');
  process.exit(1);
}
