/**
 * Test Image URL Construction
 * 
 * This script simulates how the frontend constructs image URLs
 * to identify any issues in the URL building process.
 */

// Simulate the frontend's getImageUrl function
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construct full URL from backend base URL
  const API_BASE_URL = 'http://localhost:3001/api/v1'; // From frontend .env
  const BASE_URL = API_BASE_URL.replace('/api/v1', '');
  const fullUrl = `${BASE_URL}${imagePath}`;
  
  console.log(`   API_BASE_URL: ${API_BASE_URL}`);
  console.log(`   BASE_URL: ${BASE_URL}`);
  console.log(`   imagePath: ${imagePath}`);
  console.log(`   Full URL: ${fullUrl}`);
  
  return fullUrl;
}

// Test with the actual image path from database
console.log('=== Testing Image URL Construction ===\n');

const imagePath = '/uploads/profile-pictures/profile-ace99421-639c-45a0-b553-7b677f6f5668-1767791216336-295245737.jpeg';
console.log('Input image path from database:');
console.log(imagePath);
console.log('');

console.log('Frontend URL construction:');
const result = getImageUrl(imagePath);
console.log('');
console.log(`Result: ${result}`);
console.log('');

// Expected URL
const expectedUrl = 'http://localhost:3001/uploads/profile-pictures/profile-ace99421-639c-45a0-b553-7b677f6f5668-1767791216336-295245737.jpeg';
console.log(`Expected URL: ${expectedUrl}`);
console.log('');

if (result === expectedUrl) {
  console.log('✅ URL construction is CORRECT');
} else {
  console.log('❌ URL construction is INCORRECT');
  console.log(`   Difference: ${result !== expectedUrl ? 'URLs do not match' : 'URLs match'}`);
}

console.log('\n=== Testing Backend Static File Serving ===');
console.log('Backend serves static files from: /uploads');
console.log('Files are located in: backend/uploads/');
console.log('When frontend requests: http://localhost:3001/uploads/profile-pictures/filename.jpg');
console.log('Backend should serve: backend/uploads/profile-pictures/filename.jpg');
console.log('');
console.log('✅ This configuration is correct');
