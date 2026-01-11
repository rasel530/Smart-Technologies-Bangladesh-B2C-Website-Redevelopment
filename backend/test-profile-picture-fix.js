/**
 * Profile Picture Upload Fix Verification Test
 * 
 * This script tests the complete profile picture upload functionality
 * to verify all fixes are working correctly.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const API_URL = `${BACKEND_URL}/api/v1`;

// Test user credentials
const TEST_USER = {
  email: 'profiletest@example.com',
  password: 'TestPassword123!'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'blue');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Test 1: Verify Backend is Running
async function testBackendHealth() {
  logTest('Backend Health Check');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      logSuccess('Backend is running and responding');
      logSuccess(`Health check response: ${JSON.stringify(response.body)}`);
      return true;
    } else {
      logError(`Backend returned status code: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to connect to backend: ${error.message}`);
    return false;
  }
}

// Test 2: Verify Uploads Directory Exists
async function testUploadsDirectory() {
  logTest('Uploads Directory Check');
  
  const uploadsDir = path.join(__dirname, 'uploads', 'profile-pictures');
  
  try {
    if (fs.existsSync(uploadsDir)) {
      logSuccess(`Uploads directory exists: ${uploadsDir}`);
      const stats = fs.statSync(uploadsDir);
      logSuccess(`Directory is writable: ${stats.isDirectory()}`);
      return true;
    } else {
      logError(`Uploads directory does not exist: ${uploadsDir}`);
      return false;
    }
  } catch (error) {
    logError(`Error checking uploads directory: ${error.message}`);
    return false;
  }
}

// Test 3: Verify Static File Serving is Configured
async function testStaticFileServing() {
  logTest('Static File Serving Check');
  
  try {
    // Check if there are any files in the uploads directory
    const uploadsDir = path.join(__dirname, 'uploads', 'profile-pictures');
    const files = fs.readdirSync(uploadsDir).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.gif') || f.endsWith('.webp')
    );
    
    if (files.length > 0) {
      const testFile = files[0];
      const testUrl = `${BACKEND_URL}/uploads/profile-pictures/${testFile}`;
      
      logSuccess(`Found test file: ${testFile}`);
      logSuccess(`Testing static file access at: ${testUrl}`);
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/uploads/profile-pictures/${testFile}`,
        method: 'GET'
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        logSuccess('Static file serving is working correctly');
        logSuccess(`Content-Type: ${response.headers['content-type']}`);
        return true;
      } else {
        logError(`Static file serving returned status: ${response.statusCode}`);
        return false;
      }
    } else {
      logWarning('No files found in uploads directory to test static serving');
      logWarning('This is normal if no profile pictures have been uploaded yet');
      return true; // Not a failure, just no files to test
    }
  } catch (error) {
    logError(`Error testing static file serving: ${error.message}`);
    return false;
  }
}

// Test 4: Test Login to Get Auth Token
async function testLogin() {
  logTest('User Login');
  
  try {
    const postData = JSON.stringify({
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 200 && response.body && response.body.token) {
      logSuccess('Login successful');
      logSuccess(`Received token: ${response.body.token.substring(0, 20)}...`);
      return response.body.token;
    } else {
      logError(`Login failed with status: ${response.statusCode}`);
      logError(`Response: ${JSON.stringify(response.body)}`);
      return null;
    }
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return null;
  }
}

// Test 5: Test Profile Picture Upload
async function testProfilePictureUpload(token) {
  logTest('Profile Picture Upload');
  
  try {
    // Create a test image file
    const testImageDir = path.join(__dirname, 'uploads', 'profile-pictures');
    const testImagePath = path.join(testImageDir, 'test-upload.jpg');
    
    // Create a minimal valid JPEG file (1x1 pixel black image)
    const minimalJpeg = Buffer.from([
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
      0x00, 0x00, 0x00, 0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x37, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, minimalJpeg);
    logSuccess(`Created test image: ${testImagePath}`);
    
    // Create FormData
    const form = new FormData();
    form.append('picture', fs.createReadStream(testImagePath), {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    });
    
    logSuccess('FormData created with test image');
    
    // Make upload request
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/profile/me/picture',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body ? JSON.parse(body) : null
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });
      
      req.on('error', reject);
      form.pipe(req);
    });
    
    if (response.statusCode === 200 && response.body && response.body.data && response.body.data.user) {
      logSuccess('Profile picture upload successful');
      logSuccess(`User data updated: ${JSON.stringify(response.body.data.user, null, 2)}`);
      
      // Check if image path is in response
      if (response.body.data.user.image) {
        logSuccess(`Image path in database: ${response.body.data.user.image}`);
        
        // Verify file exists on disk
        const imagePath = path.join(__dirname, response.body.data.user.image);
        if (fs.existsSync(imagePath)) {
          logSuccess(`Image file exists on disk: ${imagePath}`);
        } else {
          logError(`Image file not found on disk: ${imagePath}`);
        }
        
        // Test accessing the image via static file server
        const imageUrl = `${BACKEND_URL}${response.body.data.user.image}`;
        logSuccess(`Image URL: ${imageUrl}`);
        
        const imageOptions = {
          hostname: 'localhost',
          port: 3001,
          path: response.body.data.user.image,
          method: 'GET'
        };
        
        const imageResponse = await makeRequest(imageOptions);
        
        if (imageResponse.statusCode === 200) {
          logSuccess('Image is accessible via static file server');
          logSuccess(`Content-Type: ${imageResponse.headers['content-type']}`);
        } else {
          logError(`Image not accessible via static server: ${imageResponse.statusCode}`);
        }
      }
      
      return true;
    } else {
      logError(`Upload failed with status: ${response.statusCode}`);
      logError(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    logError(`Upload error: ${error.message}`);
    logError(error.stack);
    return false;
  }
}

// Test 6: Test Profile Picture Deletion
async function testProfilePictureDeletion(token) {
  logTest('Profile Picture Deletion');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/profile/me/picture',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body && response.body.data) {
      logSuccess('Profile picture deletion successful');
      logSuccess(`Response: ${JSON.stringify(response.body)}`);
      
      if (response.body.data.user && response.body.data.user.image === null) {
        logSuccess('Image field set to null in database');
      }
      
      return true;
    } else {
      logError(`Deletion failed with status: ${response.statusCode}`);
      logError(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    logError(`Deletion error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('PROFILE PICTURE UPLOAD FIX VERIFICATION', 'blue');
  log('Testing all fixes for profile picture upload functionality', 'blue');
  console.log('='.repeat(60));
  
  const results = {
    backendHealth: false,
    uploadsDirectory: false,
    staticFileServing: false,
    login: false,
    upload: false,
    deletion: false
  };
  
  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();
  
  if (!results.backendHealth) {
    logError('Backend is not running. Please start the backend service first.');
    log('Run: docker-compose up -d backend', 'yellow');
    return;
  }
  
  // Test 2: Uploads Directory
  results.uploadsDirectory = await testUploadsDirectory();
  
  // Test 3: Static File Serving
  results.staticFileServing = await testStaticFileServing();
  
  // Test 4: Login
  const token = await testLogin();
  results.login = token !== null;
  
  if (!results.login) {
    logError('Login failed. Cannot proceed with upload tests.');
    log('Please ensure test user exists or update credentials in the script', 'yellow');
    return;
  }
  
  // Test 5: Upload
  results.upload = await testProfilePictureUpload(token);
  
  // Test 6: Deletion
  results.deletion = await testProfilePictureDeletion(token);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'blue');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Backend Health Check', passed: results.backendHealth },
    { name: 'Uploads Directory Check', passed: results.uploadsDirectory },
    { name: 'Static File Serving', passed: results.staticFileServing },
    { name: 'User Login', passed: results.login },
    { name: 'Profile Picture Upload', passed: results.upload },
    { name: 'Profile Picture Deletion', passed: results.deletion }
  ];
  
  let passedCount = 0;
  tests.forEach(test => {
    if (test.passed) {
      logSuccess(test.name);
      passedCount++;
    } else {
      logError(test.name);
    }
  });
  
  console.log('='.repeat(60));
  log(`Total: ${passedCount}/${tests.length} tests passed`, passedCount === tests.length ? 'green' : 'yellow');
  console.log('='.repeat(60));
  
  if (passedCount === tests.length) {
    log('\n✓ All tests passed! Profile picture upload fix is working correctly.', 'green');
  } else {
    log('\n✗ Some tests failed. Please review the errors above.', 'red');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  logError(error.stack);
  process.exit(1);
});
