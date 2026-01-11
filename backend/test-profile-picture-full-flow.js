/**
 * Full Profile Picture Flow Test
 * 
 * This script tests:
 * 1. Database query for user profile
 * 2. Image file existence
 * 3. Backend API response structure
 * 4. Frontend data reception simulation
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

async function testFullFlow() {
  console.log('=== Full Profile Picture Flow Test ===\n');

  try {
    // Step 1: Get user from database (simulating GET /api/v1/profile/me)
    console.log('Step 1: Fetching user from database...');
    const user = await prisma.user.findFirst({
      where: {
        image: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        phoneVerified: true,
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ No user with profile picture found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Image path: ${user.image}`);
    console.log('');

    // Step 2: Verify file exists
    console.log('Step 2: Verifying image file exists...');
    if (!user.image) {
      console.log('❌ User has no image path in database');
      return;
    }

    const imagePath = path.join(__dirname, user.image);
    try {
      await fs.access(imagePath);
      const stats = await fs.stat(imagePath);
      console.log('✅ File exists:');
      console.log(`   Path: ${imagePath}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log('');
    } catch (error) {
      console.log('❌ File does not exist:');
      console.log(`   Expected: ${imagePath}`);
      console.log(`   Error: ${error.message}`);
      return;
    }

    // Step 3: Simulate backend API response
    console.log('Step 3: Simulating backend API response...');
    const apiResponse = {
      success: true,
      data: {
        user: user
      }
    };
    console.log('✅ API response structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');

    // Step 4: Simulate frontend data processing
    console.log('Step 4: Simulating frontend data processing...');
    const frontendUser = apiResponse.data.user;
    console.log('✅ Frontend receives user data:');
    console.log(`   user.image: ${frontendUser.image}`);
    console.log(`   user.image type: ${typeof frontendUser.image}`);
    console.log(`   user.image is truthy: ${!!frontendUser.image}`);
    console.log('');

    // Step 5: Simulate frontend URL construction
    console.log('Step 5: Simulating frontend URL construction...');
    function getImageUrl(imagePath) {
      if (!imagePath) return null;
      
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      const API_BASE_URL = 'http://localhost:3001/api/v1';
      const BASE_URL = API_BASE_URL.replace('/api/v1', '');
      return `${BASE_URL}${imagePath}`;
    }

    const imageUrl = getImageUrl(frontendUser.image);
    console.log('✅ Image URL constructed:');
    console.log(`   URL: ${imageUrl}`);
    console.log('');

    // Step 6: Simulate frontend component rendering
    console.log('Step 6: Simulating frontend component rendering...');
    console.log('Component logic:');
    console.log(`   preview = null (no new upload)`);
    console.log(`   getImageUrl(user.image) = ${getImageUrl(frontendUser.image)}`);
    console.log(`   Condition: getImageUrl(user.image) ? true : false`);
    console.log(`   Result: ${getImageUrl(frontendUser.image) ? 'SHOW IMAGE' : 'SHOW INITIALS'}`);
    console.log('');

    // Step 7: Verify the image should display
    console.log('Step 7: Verification...');
    if (getImageUrl(frontendUser.image)) {
      console.log('✅ Image SHOULD display in the component');
      console.log(`   The component should render: <img src="${imageUrl}" />`);
    } else {
      console.log('❌ Image will NOT display');
      console.log('   The component will show initials instead');
    }
    console.log('');

    // Step 8: Manual testing instructions
    console.log('Step 8: Manual testing instructions...');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Navigate to account page');
    console.log('4. Look for the image request:');
    console.log(`   ${imageUrl}`);
    console.log('5. Check if the request:');
    console.log('   - Returns 200 OK (image loads successfully)');
    console.log('   - Returns 404 Not Found (image not found)');
    console.log('   - Returns 403 Forbidden (CORS issue)');
    console.log('   - Returns 500 Internal Server Error (server error)');
    console.log('');
    console.log('6. Check the Console tab for any JavaScript errors');
    console.log('7. Check the Elements tab to see if the <img> tag is rendered');
    console.log('');

    // Step 9: Common issues and solutions
    console.log('Step 9: Common issues and solutions...');
    console.log('Issue 1: Image not loading (404 error)');
    console.log('   Solution: Check backend is running on port 3001');
    console.log('   Solution: Verify static file serving is configured');
    console.log('');
    console.log('Issue 2: CORS error');
    console.log('   Solution: Check CORS configuration in backend');
    console.log('   Solution: Ensure frontend origin is allowed');
    console.log('');
    console.log('Issue 3: Image loads but not visible');
    console.log('   Solution: Check CSS (object-cover, width, height)');
    console.log('   Solution: Check if image is behind other elements');
    console.log('');
    console.log('Issue 4: Data not updating after upload');
    console.log('   Solution: Check if onUpdate callback is called');
    console.log('   Solution: Check if profileData state is updated');
    console.log('   Solution: Check if AuthContext user state is updated');
    console.log('');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testFullFlow();
