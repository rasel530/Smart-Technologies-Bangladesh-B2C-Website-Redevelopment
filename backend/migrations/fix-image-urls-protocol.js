/**
 * Database Migration Script: Fix Image URLs Protocol and Port
 * 
 * This script updates all product image URLs from incorrect protocol/port
 * to correct format using the BACKEND_URL environment variable.
 * 
 * Usage:
 *   node backend/migrations/fix-image-urls-protocol.js
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
 * Main migration function
 */
async function fixImageUrls() {
  console.log('='.repeat(60));
  console.log('Image URL Migration: Fix Protocol and Port');
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

      // Fix originalUrl
      if (image.originalUrl) {
        let newOriginalUrl = image.originalUrl;
        
        // Replace https://localhost:3000 with http://localhost:3001
        if (newOriginalUrl.includes('https://localhost:3000/uploads/')) {
          newOriginalUrl = newOriginalUrl.replace('https://localhost:3000/uploads/', `${backendUrl}/uploads/`);
          updates.originalUrl = newOriginalUrl;
          needsUpdate = true;
          originalUrlUpdated++;
          console.log(`  [${image.id}] originalUrl: ${image.originalUrl} → ${newOriginalUrl}`);
        }
        // Replace http://localhost:3000 with http://localhost:3001
        else if (newOriginalUrl.includes('http://localhost:3000/uploads/')) {
          newOriginalUrl = newOriginalUrl.replace('http://localhost:3000/uploads/', `${backendUrl}/uploads/`);
          updates.originalUrl = newOriginalUrl;
          needsUpdate = true;
          originalUrlUpdated++;
          console.log(`  [${image.id}] originalUrl: ${image.originalUrl} → ${newOriginalUrl}`);
        }
      }

      // Fix optimizedUrl
      if (image.optimizedUrl) {
        let newOptimizedUrl = image.optimizedUrl;
        
        // Replace https://localhost:3000 with http://localhost:3001
        if (newOptimizedUrl.includes('https://localhost:3000/uploads/')) {
          newOptimizedUrl = newOptimizedUrl.replace('https://localhost:3000/uploads/', `${backendUrl}/uploads/`);
          updates.optimizedUrl = newOptimizedUrl;
          needsUpdate = true;
          optimizedUrlUpdated++;
          console.log(`  [${image.id}] optimizedUrl: ${image.optimizedUrl} → ${newOptimizedUrl}`);
        }
        // Replace http://localhost:3000 with http://localhost:3001
        else if (newOptimizedUrl.includes('http://localhost:3000/uploads/')) {
          newOptimizedUrl = newOptimizedUrl.replace('http://localhost:3000/uploads/', `${backendUrl}/uploads/`);
          updates.optimizedUrl = newOptimizedUrl;
          needsUpdate = true;
          optimizedUrlUpdated++;
          console.log(`  [${image.id}] optimizedUrl: ${image.optimizedUrl} → ${newOptimizedUrl}`);
        }
      }

      // Fix thumbnailUrl
      if (image.thumbnailUrl) {
        let newThumbnailUrl = image.thumbnailUrl;
        
        // Replace https://localhost:3000 with http://localhost:3001
        if (newThumbnailUrl.includes('https://localhost:3000/uploads/')) {
          newThumbnailUrl = newThumbnailUrl.replace('https://localhost:3000/uploads/', `${backendUrl}/uploads/`);
          updates.thumbnailUrl = newThumbnailUrl;
          needsUpdate = true;
          thumbnailUrlUpdated++;
          console.log(`  [${image.id}] thumbnailUrl: ${image.thumbnailUrl} → ${newThumbnailUrl}`);
        }
        // Replace http://localhost:3000 with http://localhost:3001
        else if (newThumbnailUrl.includes('http://localhost:3000/uploads/')) {
          newThumbnailUrl = newThumbnailUrl.replace('http://localhost:3000/uploads/', `${backendUrl}/uploads/`);
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
fixImageUrls();
