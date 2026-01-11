/**
 * Profile Picture Display Diagnosis Script
 * 
 * This script checks:
 * 1. Database for user profile picture paths
 * 2. File system for uploaded images
 * 3. Static file serving configuration
 * 4. URL construction
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

async function diagnoseProfilePictureDisplay() {
  console.log('=== Profile Picture Display Diagnosis ===\n');

  try {
    // 1. Check database for users with profile pictures
    console.log('1. Checking database for users with profile pictures...');
    const usersWithPictures = await prisma.user.findMany({
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
        image: true
      }
    });

    console.log(`   Found ${usersWithPictures.length} users with profile pictures:`);
    usersWithPictures.forEach(user => {
      console.log(`   - ${user.email}: ${user.image}`);
    });

    if (usersWithPictures.length === 0) {
      console.log('   ⚠️  No users have profile pictures in the database');
      console.log('   → Upload a profile picture first to test display');
      return;
    }

    // 2. Check if files exist on disk
    console.log('\n2. Checking if profile picture files exist on disk...');
    const uploadsDir = path.join(__dirname, 'uploads', 'profile-pictures');
    
    try {
      const files = await fs.readdir(uploadsDir);
      console.log(`   Found ${files.length} files in uploads directory:`);
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
    } catch (error) {
      console.log('   ❌ Error reading uploads directory:', error.message);
    }

    // 3. Verify each user's image file exists
    console.log('\n3. Verifying each user\'s image file...');
    for (const user of usersWithPictures) {
      if (!user.image) continue;
      
      const imagePath = path.join(__dirname, user.image);
      try {
        await fs.access(imagePath);
        const stats = await fs.stat(imagePath);
        console.log(`   ✅ ${user.email}: File exists (${(stats.size / 1024).toFixed(2)} KB)`);
      } catch (error) {
        console.log(`   ❌ ${user.email}: File NOT found at ${imagePath}`);
        console.log(`      Expected path: ${imagePath}`);
      }
    }

    // 4. Check static file serving configuration
    console.log('\n4. Static file serving configuration:');
    console.log('   Static files are served from: /uploads');
    console.log('   Files are located in: backend/uploads/');
    console.log('   Access URL pattern: http://localhost:3001/uploads/profile-pictures/filename.jpg');

    // 5. Construct and display expected URLs
    console.log('\n5. Expected image URLs for frontend:');
    const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
    usersWithPictures.forEach(user => {
      if (!user.image) return;
      const imageUrl = `${API_BASE_URL}${user.image}`;
      console.log(`   ${user.email}:`);
      console.log(`   Backend path: ${user.image}`);
      console.log(`   Full URL: ${imageUrl}`);
      console.log('');
    });

    // 6. Check for common issues
    console.log('\n6. Common issues to check:');
    console.log('   ✅ Backend static file serving: app.use(\'/uploads\', express.static(...))');
    console.log('   ✅ Image path in database: /uploads/profile-pictures/filename.jpg');
    console.log('   ✅ Frontend URL construction: BASE_URL + image_path');
    console.log('   ⚠️  CORS configuration: Ensure frontend origin is allowed');
    console.log('   ⚠️  File permissions: Ensure files are readable');
    console.log('   ⚠️  Browser cache: Clear cache if images don\'t update');

    // 7. Test URL accessibility
    console.log('\n7. Manual testing instructions:');
    console.log('   Open these URLs in your browser to verify images are accessible:');
    usersWithPictures.forEach(user => {
      if (!user.image) return;
      const imageUrl = `${API_BASE_URL}${user.image}`;
      console.log(`   - ${imageUrl}`);
    });

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseProfilePictureDisplay();
