/**
 * Database Migration Script: Convert Image URLs to Relative Paths
 * 
 * This script converts all product image URLs from absolute to relative format.
 * Relative URLs work better with Next.js rewrites and avoid protocol/port issues.
 * 
 * Usage:
 *   node backend/migrations/convert-to-relative-urls.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL database connection string
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

/**
 * Converts an absolute URL to a relative path
 * @param {string} url - The absolute URL
 * @returns {string} - The relative path
 */
function convertToRelativePath(url) {
  if (!url) {
    return url;
  }

  // If already relative (starts with /), return as-is
  if (url.startsWith('/')) {
    return url;
  }

  // Extract path from URL
  try {
    const urlObj = new URL(url);
    let relativePath = urlObj.pathname;
    
    // Ensure it starts with /
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }
    
    return relativePath;
  } catch (error) {
    // If URL parsing fails, assume it's already relative
    console.warn(`Warning: Could not parse URL: ${url}, using as-is`);
    return url;
  }
}

/**
 * Main migration function
 */
async function convertImageUrls() {
  console.log('='.repeat(60));
  console.log('Image URL Migration: Absolute to Relative Paths');
  console.log('='.repeat(60));
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
      console.log('No images to migrate. Exiting.');
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

      // Convert originalUrl
      if (image.originalUrl) {
        const newOriginalUrl = convertToRelativePath(image.originalUrl);
        if (newOriginalUrl !== image.originalUrl) {
          updates.originalUrl = newOriginalUrl;
          needsUpdate = true;
          originalUrlUpdated++;
          console.log(`  [${image.id}] originalUrl: ${image.originalUrl} → ${newOriginalUrl}`);
        }
      }

      // Convert optimizedUrl
      if (image.optimizedUrl) {
        const newOptimizedUrl = convertToRelativePath(image.optimizedUrl);
        if (newOptimizedUrl !== image.optimizedUrl) {
          updates.optimizedUrl = newOptimizedUrl;
          needsUpdate = true;
          optimizedUrlUpdated++;
          console.log(`  [${image.id}] optimizedUrl: ${image.optimizedUrl} → ${newOptimizedUrl}`);
        }
      }

      // Convert thumbnailUrl
      if (image.thumbnailUrl) {
        const newThumbnailUrl = convertToRelativePath(image.thumbnailUrl);
        if (newThumbnailUrl !== image.thumbnailUrl) {
          updates.thumbnailUrl = newThumbnailUrl;
          needsUpdate = true;
          thumbnailUrlUpdated++;
          console.log(`  [${image.id}] thumbnailUrl: ${image.thumbnailUrl} → ${newThumbnailUrl}`);
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
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total images processed: ${images.length}`);
    console.log(`Images updated: ${totalUpdated}`);
    console.log(`  - originalUrl updated: ${originalUrlUpdated}`);
    console.log(`  - optimizedUrl updated: ${optimizedUrlUpdated}`);
    console.log(`  - thumbnailUrl updated: ${thumbnailUrlUpdated}`);
    console.log('');
    console.log('✓ Migration completed successfully');
    console.log('');

    if (totalUpdated > 0) {
      console.log('Updated Image IDs:');
      updatedImageIds.forEach(id => console.log(`  - ${id}`));
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('Migration Failed');
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

// Run the migration
convertImageUrls();
