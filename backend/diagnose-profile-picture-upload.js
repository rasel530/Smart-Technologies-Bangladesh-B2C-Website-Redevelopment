/**
 * Profile Picture Upload Diagnostic Test
 * 
 * This script performs a comprehensive diagnosis of the profile picture upload
 * functionality to identify why pictures aren't being saved or displayed.
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
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
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

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
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

// Test 1: Check Backend Health
async function testBackendHealth() {
  logSection('1. Backend Health Check');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      logSuccess('Backend is running');
      logInfo(`Response: ${JSON.stringify(response.body, null, 2)}`);
      return true;
    } else {
      logError(`Backend returned status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to connect: ${error.message}`);
    return false;
  }
}

// Test 2: Check Uploads Directory Structure
async function testUploadsDirectory() {
  logSection('2. Uploads Directory Structure Check');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
  
  try {
    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      logError(`Uploads directory does not exist: ${uploadsDir}`);
      return false;
    }
    logSuccess(`Uploads directory exists: ${uploadsDir}`);
    
    // Check if profile-pictures directory exists
    if (!fs.existsSync(profilePicturesDir)) {
      logError(`Profile pictures directory does not exist: ${profilePicturesDir}`);
      return false;
    }
    logSuccess(`Profile pictures directory exists: ${profilePicturesDir}`);
    
    // Check directory permissions
    try {
      const testFile = path.join(profilePicturesDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      logSuccess('Directory is writable');
    } catch (error) {
      logError(`Directory is not writable: ${error.message}`);
      return false;
    }
    
    // List existing files
    const files = fs.readdirSync(profilePicturesDir);
    if (files.length > 0) {
      logInfo(`Found ${files.length} existing file(s) in profile-pictures directory:`);
      files.forEach(file => {
        const filePath = path.join(profilePicturesDir, file);
        const stats = fs.statSync(filePath);
        logInfo(`  - ${file} (${stats.size} bytes, ${new Date(stats.mtime).toISOString()})`);
      });
    } else {
      logInfo('No existing files in profile-pictures directory');
    }
    
    return true;
  } catch (error) {
    logError(`Error checking directory structure: ${error.message}`);
    return false;
  }
}

// Test 3: Test User Login
async function testLogin() {
  logSection('3. User Login Test');
  
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
      logInfo(`Token: ${response.body.token.substring(0, 30)}...`);
      
      if (response.body.user) {
        logInfo(`User ID: ${response.body.user.id}`);
        logInfo(`Current profile image: ${response.body.user.image || 'None'}`);
      }
      
      return { token: response.body.token, userId: response.body.user?.id };
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

// Test 4: Test Profile Picture Upload
async function testProfilePictureUpload(token, userId) {
  logSection('4. Profile Picture Upload Test');
  
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
      0x00, 0x00, 0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x37, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, minimalJpeg);
    logSuccess(`Test image created: ${testImagePath}`);
    
    // Create FormData
    const form = new FormData();
    form.append('picture', fs.createReadStream(testImagePath), {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    });
    
    logInfo('FormData prepared with field name: picture');
    
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
    
    logInfo('Sending upload request to: POST /api/v1/profile/me/picture');
    
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
    
    logInfo(`Response status: ${response.statusCode}`);
    logInfo(`Response body: ${JSON.stringify(response.body, null, 2)}`);
    
    if (response.statusCode === 200 && response.body && response.body.data && response.body.data.user) {
      logSuccess('Profile picture upload successful');
      
      const uploadedUser = response.body.data.user;
      logInfo(`User ID: ${uploadedUser.id}`);
      logInfo(`Image path in database: ${uploadedUser.image || 'None'}`);
      
      if (uploadedUser.image) {
        // Verify file exists on disk
        const imagePath = path.join(__dirname, '..', uploadedUser.image);
        logInfo(`Expected file path: ${imagePath}`);
        
        if (fs.existsSync(imagePath)) {
          logSuccess('Image file exists on disk');
          const stats = fs.statSync(imagePath);
          logInfo(`File size: ${stats.size} bytes`);
        } else {
          logError('Image file NOT found on disk');
          
          // Check if file exists in uploads directory
          const files = fs.readdirSync(testImageDir);
          logInfo(`Files in directory: ${files.join(', ')}`);
        }
        
        // Test accessing the image via static file server
        const imageUrl = `${BACKEND_URL}${uploadedUser.image}`;
        logInfo(`Image URL: ${imageUrl}`);
        
        const imageOptions = {
          hostname: 'localhost',
          port: 3001,
          path: uploadedUser.image,
          method: 'GET'
        };
        
        const imageResponse = await makeRequest(imageOptions);
        
        if (imageResponse.statusCode === 200) {
          logSuccess('Image is accessible via static file server');
          logInfo(`Content-Type: ${imageResponse.headers['content-type']}`);
          logInfo(`Content-Length: ${imageResponse.headers['content-length']}`);
        } else {
          logError(`Image not accessible via static server: ${imageResponse.statusCode}`);
          logError(`Response: ${JSON.stringify(imageResponse.body)}`);
        }
      } else {
        logError('No image path returned in response');
      }
      
      return true;
    } else {
      logError('Upload failed');
      return false;
    }
  } catch (error) {
    logError(`Upload error: ${error.message}`);
    logError(error.stack);
    return false;
  }
}

// Test 5: Get User Profile
async function testGetProfile(token) {
  logSection('5. Get User Profile Test');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/profile/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body && response.body.data && response.body.data.user) {
      logSuccess('Profile retrieved successfully');
      const user = response.body.data.user;
      logInfo(`User ID: ${user.id}`);
      logInfo(`Email: ${user.email}`);
      logInfo(`Profile image: ${user.image || 'None'}`);
      
      if (user.image) {
        // Check if image URL is properly formatted
        if (user.image.startsWith('/uploads/')) {
          logSuccess('Image path has correct format');
        } else {
          logWarning(`Image path format may be incorrect: ${user.image}`);
        }
      }
      
      return user;
    } else {
      logError('Failed to retrieve profile');
      return null;
    }
  } catch (error) {
    logError(`Get profile error: ${error.message}`);
    return null;
  }
}

// Test 6: Check Database Records
async function testDatabaseRecords(userId) {
  logSection('6. Database Records Check');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        image: true,
        updatedAt: true
      }
    });
    
    if (user) {
      logSuccess('User found in database');
      logInfo(`User ID: ${user.id}`);
      logInfo(`Email: ${user.email}`);
      logInfo(`Image field in database: ${user.image || 'NULL'}`);
      logInfo(`Last updated: ${user.updatedAt}`);
      
      if (user.image) {
        // Verify file exists
        const imagePath = path.join(__dirname, '..', user.image);
        if (fs.existsSync(imagePath)) {
          logSuccess('Database image path matches existing file');
        } else {
          logError('Database image path does not match any file on disk');
        }
      }
      
      await prisma.$disconnect();
      return user;
    } else {
      logError('User not found in database');
      await prisma.$disconnect();
      return null;
    }
  } catch (error) {
    logError(`Database error: ${error.message}`);
    return null;
  }
}

// Main test runner
async function runDiagnostics() {
  console.log('\n' + '='.repeat(70));
  log('PROFILE PICTURE UPLOAD COMPREHENSIVE DIAGNOSTICS', 'magenta');
  log('Identifying why profile pictures are not being saved or displayed', 'magenta');
  console.log('='.repeat(70));
  
  const results = {
    backendHealth: false,
    uploadsDirectory: false,
    login: false,
    upload: false,
    getProfile: false,
    databaseRecords: false
  };
  
  let token = null;
  let userId = null;
  
  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();
  
  if (!results.backendHealth) {
    logError('Backend is not running. Please start the backend service first.');
    log('Run: docker-compose up -d backend', 'yellow');
    return;
  }
  
  // Test 2: Uploads Directory
  results.uploadsDirectory = await testUploadsDirectory();
  
  if (!results.uploadsDirectory) {
    logError('Uploads directory structure is incorrect. Cannot proceed.');
    return;
  }
  
  // Test 3: Login
  const loginResult = await testLogin();
  if (loginResult) {
    token = loginResult.token;
    userId = loginResult.userId;
    results.login = true;
  }
  
  if (!results.login) {
    logError('Login failed. Cannot proceed with upload tests.');
    log('Please ensure test user exists or update credentials in the script', 'yellow');
    return;
  }
  
  // Test 4: Upload
  results.upload = await testProfilePictureUpload(token, userId);
  
  // Test 5: Get Profile
  results.getProfile = await testGetProfile(token);
  
  // Test 6: Database Records
  if (userId) {
    results.databaseRecords = await testDatabaseRecords(userId);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  log('DIAGNOSTIC SUMMARY', 'magenta');
  console.log('='.repeat(70));
  
  const tests = [
    { name: 'Backend Health Check', passed: results.backendHealth },
    { name: 'Uploads Directory Structure', passed: results.uploadsDirectory },
    { name: 'User Login', passed: results.login },
    { name: 'Profile Picture Upload', passed: results.upload },
    { name: 'Get User Profile', passed: results.getProfile },
    { name: 'Database Records Check', passed: results.databaseRecords }
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
  
  console.log('='.repeat(70));
  log(`Total: ${passedCount}/${tests.length} tests passed`, passedCount === tests.length ? 'green' : 'yellow');
  console.log('='.repeat(70));
  
  // Provide recommendations
  console.log('\n' + '='.repeat(70));
  log('RECOMMENDATIONS', 'cyan');
  console.log('='.repeat(70));
  
  if (!results.upload) {
    logError('Profile picture upload is failing. Check:');
    log('  1. Backend logs for multer errors', 'yellow');
    log('  2. File size limits and allowed types', 'yellow');
    log('  3. Authentication middleware', 'yellow');
    log('  4. Network connectivity to backend', 'yellow');
  }
  
  if (results.upload && !results.getProfile) {
    logError('Upload succeeded but profile retrieval failed. Check:');
    log('  1. Database update logic', 'yellow');
    log('  2. Profile endpoint implementation', 'yellow');
  }
  
  if (results.upload && results.getProfile && !results.databaseRecords) {
    logError('Upload and retrieval work but database records are inconsistent. Check:');
    log('  1. Database transaction logic', 'yellow');
    log('  2. Prisma update query', 'yellow');
  }
  
  if (passedCount === tests.length) {
    logSuccess('\n✓ All diagnostics passed! The issue may be in the frontend display logic.');
    log('Check how the frontend constructs the image URL from the backend response.', 'yellow');
  } else {
    logError('\n✗ Some diagnostics failed. Review the errors above for details.');
  }
  
  console.log('='.repeat(70));
}

// Run diagnostics
runDiagnostics().catch(error => {
  logError(`Diagnostic runner error: ${error.message}`);
  logError(error.stack);
  process.exit(1);
});
