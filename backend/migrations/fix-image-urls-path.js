/**
 * Database Migration Script: Fix Image URLs to Include products/ in Path
 * 
 * This script fixes image URLs that are missing the 'products/' directory in the path.
 * The correct format should be: http://localhost:3001/uploads/products/{productId}/{filename}
 * 
 * Usage:
 *   node backend/migrations/fix-image-urls-path.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL database connection string
 *   - BACKEND_URL: Backend server URL (e.g., http://localhost:3001)
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

/**
 * Fixes an image URL to include 'products/' in the path
 * @param {string} url - The current URL
 * @param {string} backendUrl - The backend base URL
 * @returns {string} - The corrected URL
 */
function fixImageUrl(url, backendUrl) {
  if (!url) {
    return url;
  }

  // If URL doesn't start with backend URL, return as-is
  if (!url.startsWith(backendUrl)) {
    return url;
  }

  // Extract the path after backend URL
  const pathPart = url.substring(backendUrl.length);
  
  // Check if path starts with /uploads/ but doesn't have /products/ after it
  if (pathPart.startsWith('/uploads/') && !pathPart.startsWith('/uploads/products/')) {
    // Extract the rest of the path (after /uploads/)
    const restOfPath = pathPart.substring('/uploads/'.length);
    
    // Check if it starts with a UUID (product ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidRegex.test(restOfPath)) {
      // This is a product image URL missing the 'products/' part
      const fixedUrl = `${backendUrl}/uploads/products/${restOfPath}`;
      return fixedUrl;
    }
  }

  // URL is already correct or doesn't need fixing
  return url;
}

/**
 * Main migration function
 */
async function fixImageUrls() {
  console.log('='.repeat(60));
  console.log('Image URL Fix: Add products/ to Path');
  console.log('='.repeat(60));
  console.log('');

  const backendUrl = process.env.BACKEND_URL;
  
  if (!backendUrl) {
    console.error('ERROR: BACKEND_URL environment variable is not set!');
    console.error('Please set BACKEND_URL in your .env file (e.g., http://localhost:3001)');
    process.exit(1);
  }

  console.log(`Backend URL: ${backendUrl}`);
  console.log('');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    console.log('');

    // Query all product images that are not deleted
    console.log('Querying product images...');
    const images = await prisma.productImage.findMany({
      where: {
        processingStatus: {
          not: 'deleted'
        }
      },
      select: {
        id: true,
        productId: true,
        originalUrl: true,
        optimizedUrl: true,
        thumbnailUrl: true,
        processingStatus: true
      }
    });

    console.log(`Found ${images.length} product images`);
    console.log('');

    if (images.length === 0) {
      console.log('No images to fix. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Track statistics
    let totalUpdated = 0;
    let originalUrlUpdated = 0;
    let optimizedUrlUpdated = 0;
    let thumbnailUrlUpdated = 0;
    const updatedImageIds = [];

    // Process each image
    console.log('Processing images...');
    console.log('');

    for (const image of images) {
      const updates = {};
      let needsUpdate = false;

      // Check and fix originalUrl
      if (image.originalUrl) {
        const newOriginalUrl = fixImageUrl(image.originalUrl, backendUrl);
        if (newOriginalUrl !== image.originalUrl) {
          updates.originalUrl = newOriginalUrl;
          needsUpdate = true;
          originalUrlUpdated++;
          console.log(`  [${image.id}] originalUrl: ${image.originalUrl}`);
          console.log(`       → ${newOriginalUrl}`);
        }
      }

      // Check and fix optimizedUrl
      if (image.optimizedUrl) {
        const newOptimizedUrl = fixImageUrl(image.optimizedUrl, backendUrl);
        if (newOptimizedUrl !== image.optimizedUrl) {
          updates.optimizedUrl = newOptimizedUrl;
          needsUpdate = true;
          optimizedUrlUpdated++;
          console.log(`  [${image.id}] optimizedUrl: ${image.optimizedUrl}`);
          console.log(`       → ${newOptimizedUrl}`);
        }
      }

      // Check and fix thumbnailUrl
      if (image.thumbnailUrl) {
        const newThumbnailUrl = fixImageUrl(image.thumbnailUrl, backendUrl);
        if (newThumbnailUrl !== image.thumbnailUrl) {
          updates.thumbnailUrl = newThumbnailUrl;
          needsUpdate = true;
          thumbnailUrlUpdated++;
          console.log(`  [${image.id}] thumbnailUrl: ${image.thumbnailUrl}`);
          console.log(`       → ${newThumbnailUrl}`);
        }
      }

      // Update database if needed
      if (needsUpdate) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: updates
        });
        totalUpdated++;
        updatedImageIds.push(image.id);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Fix Summary');
    console.log('='.repeat(60));
    console.log(`Total images processed: ${images.length}`);
    console.log(`Images updated: ${totalUpdated}`);
    console.log(`  - originalUrl updated: ${originalUrlUpdated}`);
    console.log(`  - optimizedUrl updated: ${optimizedUrlUpdated}`);
    console.log(`  - thumbnailUrl updated: ${thumbnailUrlUpdated}`);
    console.log('');
    console.log('✓ Fix completed successfully');
    console.log('');

    if (totalUpdated > 0) {
      console.log('Updated Image IDs:');
      updatedImageIds.forEach(id => console.log(`  - ${id}`));
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('Fix Failed');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Stack Trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Run fix
fixImageUrls();
