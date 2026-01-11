/**
 * Test script to diagnose profile picture upload issues
 * This will test the backend endpoint directly
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test token (replace with a valid token from your system)
const TEST_TOKEN = 'your_test_token_here';

async function testProfilePictureUpload() {
  console.log('=== Profile Picture Upload Debug Test ===\n');

  // Create a test image file
  const testImagePath = path.join(__dirname, 'test-upload.jpg');
  
  // Create a simple 1x1 pixel JPEG
  const testImageBuffer = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////wAALCAACAgBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AT//Z',
    'base64'
  );
  
  fs.writeFileSync(testImagePath, testImageBuffer);
  console.log('✓ Test image created at:', testImagePath);

  try {
    // Test 1: Upload without token (should fail with 401)
    console.log('\n--- Test 1: Upload without authentication ---');
    const formData1 = new FormData();
    formData1.append('picture', fs.createReadStream(testImagePath));

    const response1 = await fetch(`${API_BASE_URL}/profile/me/picture`, {
      method: 'POST',
      body: formData1
    });

    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));

    // Test 2: Upload with token
    console.log('\n--- Test 2: Upload with authentication ---');
    const formData2 = new FormData();
    formData2.append('picture', fs.createReadStream(testImagePath));

    const response2 = await fetch(`${API_BASE_URL}/profile/me/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: formData2
    });

    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));

    // Test 3: Check upload directory
    console.log('\n--- Test 3: Check upload directory ---');
    const uploadDir = path.join(__dirname, 'uploads/profile-pictures');
    try {
      const files = fs.readdirSync(uploadDir);
      console.log('Files in upload directory:', files);
    } catch (error) {
      console.log('Upload directory does not exist or is not accessible:', error.message);
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n✓ Test image cleaned up');
    }
  }
}

// Run the test
console.log('Note: Please update TEST_TOKEN with a valid authentication token before running this test.');
console.log('You can get a token by logging in and checking localStorage in the browser.\n');
testProfilePictureUpload();
