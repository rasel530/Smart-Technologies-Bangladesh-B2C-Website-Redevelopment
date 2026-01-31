/**
 * Cleanup Script: Remove Orphaned Image Records
 * 
 * This script identifies and removes product image records from the database
 * when the corresponding image files do not exist on disk.
 * 
 * Usage:
 *   # Preview what would be deleted (dry run)
 *   node backend/scripts/cleanup-orphaned-images.js --dry-run
 * 
 *   # Actually delete orphaned records
 *   node backend/scripts/cleanup-orphaned-images.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL database connection string
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// Default uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');

/**
 * Extracts the filename from a URL
 * @param {string} url - The image URL
 * @returns {string|null} - The filename or null if not found
 */
function extractFilenameFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    // Handle absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return path.basename(pathname);
    }

    // Handle relative URLs
    return path.basename(url);
  } catch (error) {
    console.warn(`Warning: Could not extract filename from URL: ${url}`);
    return null;
  }
}

/**
 * Checks if a file exists in the uploads directory
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if file exists, false otherwise
 */
function fileExists(filename) {
  if (!filename) {
    return false;
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.warn(`Warning: Error checking file existence: ${filePath}`);
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanupOrphanedImages() {
  console.log('='.repeat(60));
  console.log('Orphaned Image Records Cleanup');
  console.log('='.repeat(60));
  console.log('');

  // Check for dry-run flag
  const dryRun = process.argv.includes('--dry-run');
  
  if (dryRun) {
    console.log('DRY RUN MODE: No records will be deleted');
    console.log('');
  }

  console.log(`Uploads Directory: ${UPLOADS_DIR}`);
  console.log('');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    console.log('');

    // Check if uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log(`Warning: Uploads directory does not exist: ${UPLOADS_DIR}`);
      console.log('All image records will be considered orphaned');
      console.log('');
    }

    // Query all product images
    console.log('Querying product images...');
    const images = await prisma.productImage.findMany({
      select: {
        id: true,
        productId: true,
        originalUrl: true,
        optimizedUrl: true,
        thumbnailUrl: true,
        processingStatus: true,
        createdAt: true
      }
    });

    console.log(`Found ${images.length} product images`);
    console.log('');

    if (images.length === 0) {
      console.log('No images to process. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Identify orphaned images
    console.log('Checking for orphaned images...');
    console.log('');

    const orphanedImages = [];
    const validImages = [];

    for (const image of images) {
      let hasFile = false;

      // Check originalUrl file
      if (image.originalUrl) {
        const originalFilename = extractFilenameFromUrl(image.originalUrl);
        if (originalFilename && fileExists(originalFilename)) {
          hasFile = true;
        }
      }

      // Check optimizedUrl file (if original doesn't exist)
      if (!hasFile && image.optimizedUrl) {
        const optimizedFilename = extractFilenameFromUrl(image.optimizedUrl);
        if (optimizedFilename && fileExists(optimizedFilename)) {
          hasFile = true;
        }
      }

      // Check thumbnailUrl file (if original and optimized don't exist)
      if (!hasFile && image.thumbnailUrl) {
        const thumbnailFilename = extractFilenameFromUrl(image.thumbnailUrl);
        if (thumbnailFilename && fileExists(thumbnailFilename)) {
          hasFile = true;
        }
      }

      if (hasFile) {
        validImages.push(image);
      } else {
        orphanedImages.push(image);
        console.log(`  [ORPHANED] ${image.id}`);
        console.log(`    Product ID: ${image.productId}`);
        console.log(`    Original URL: ${image.originalUrl || 'N/A'}`);
        console.log(`    Optimized URL: ${image.optimizedUrl || 'N/A'}`);
        console.log(`    Thumbnail URL: ${image.thumbnailUrl || 'N/A'}`);
        console.log(`    Created At: ${image.createdAt.toISOString()}`);
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Total images: ${images.length}`);
    console.log(`Valid images (files exist): ${validImages.length}`);
    console.log(`Orphaned images (files missing): ${orphanedImages.length}`);
    console.log('');

    if (orphanedImages.length === 0) {
      console.log('✓ No orphaned images found. Cleanup not needed.');
      await prisma.$disconnect();
      return;
    }

    if (dryRun) {
      console.log('DRY RUN: The following records would be deleted:');
      console.log('');
      orphanedImages.forEach(image => {
        console.log(`  - ${image.id} (Product: ${image.productId})`);
      });
      console.log('');
      console.log('Run without --dry-run flag to actually delete these records.');
    } else {
      console.log('Deleting orphaned image records...');
      console.log('');

      // Delete orphaned records permanently
      const orphanedIds = orphanedImages.map(img => img.id);
      
      for (const id of orphanedIds) {
        await prisma.productImage.delete({
          where: { id }
        });
        console.log(`  ✓ Deleted: ${id}`);
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('✓ Cleanup completed successfully');
      console.log('='.repeat(60));
      console.log(`Deleted ${orphanedImages.length} orphaned image records`);
      console.log('');
      console.log('Note: Records were permanently deleted from the database.');
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('Cleanup Failed');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Stack Trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('');
    console.log('Database connection closed');
  }
}

// Run the cleanup
cleanupOrphanedImages();
