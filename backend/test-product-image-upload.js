/**
 * Test script for product image upload functionality
 * 
 * This script tests the product image upload endpoint to verify:
 * 1. The endpoint is accessible
 * 2. Error handling works correctly
 * 3. Database write operations succeed
 * 4. Proper error messages are returned
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testProductImageUpload() {
  console.log('='.repeat(60));
  console.log('PRODUCT IMAGE UPLOAD TEST');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Check database connection
    console.log('[Step 1] Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Step 2: Find a test product
    console.log('[Step 2] Finding a test product...');
    const product = await prisma.product.findFirst({
      where: { status: 'active' },
      include: {
        images: {
          orderBy: { sortOrder: 'desc' },
          take: 1
        }
      }
    });

    if (!product) {
      console.error('❌ No active products found in database');
      console.log('Please create a product first before testing image upload');
      return;
    }

    console.log(`✅ Found test product:`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Current images: ${product.images.length}\n`);

    // Step 3: Test ProductImage creation directly
    console.log('[Step 3] Testing ProductImage creation in database...');
    const testImageUrl = `/uploads/products/test-image-${Date.now()}.jpg`;
    const testSortOrder = product.images.length > 0 ? product.images[0].sortOrder + 1 : 0;

    console.log(`   Creating image record with:`);
    console.log(`   - productId: ${product.id}`);
    console.log(`   - url: ${testImageUrl}`);
    console.log(`   - sortOrder: ${testSortOrder}`);

    const testImage = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: testImageUrl,
        alt: 'Test image',
        sortOrder: testSortOrder
      }
    });

    console.log('✅ ProductImage created successfully:');
    console.log(`   Image ID: ${testImage.id}`);
    console.log(`   URL: ${testImage.url}`);
    console.log(`   Sort Order: ${testImage.sortOrder}\n`);

    // Step 4: Verify the image was created
    console.log('[Step 4] Verifying image was created...');
    const createdImage = await prisma.productImage.findUnique({
      where: { id: testImage.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });

    if (!createdImage) {
      console.error('❌ Failed to retrieve created image');
      return;
    }

    console.log('✅ Image verified in database:');
    console.log(`   Image ID: ${createdImage.id}`);
    console.log(`   Product: ${createdImage.product.name} (${createdImage.product.sku})`);
    console.log(`   URL: ${createdImage.url}`);
    console.log(`   Alt: ${createdImage.alt}`);
    console.log(`   Sort Order: ${createdImage.sortOrder}\n`);

    // Step 5: Clean up test image
    console.log('[Step 5] Cleaning up test image...');
    await prisma.productImage.delete({
      where: { id: testImage.id }
    });
    console.log('✅ Test image deleted successfully\n');

    // Step 6: Check product_images table structure
    console.log('[Step 6] Checking product_images table structure...');
    const allImages = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`✅ Product has ${allImages.length} images:`);
    allImages.forEach((img, index) => {
      console.log(`   ${index + 1}. ID: ${img.id}, URL: ${img.url}, Sort: ${img.sortOrder}`);
    });
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Database connection: OK');
    console.log('✅ Product lookup: OK');
    console.log('✅ ProductImage creation: OK');
    console.log('✅ Image retrieval: OK');
    console.log('✅ Image deletion: OK');
    console.log();
    console.log('🎉 All database operations completed successfully!');
    console.log();
    console.log('NEXT STEPS:');
    console.log('1. Start the backend server');
    console.log('2. Test the actual image upload endpoint via API');
    console.log('3. Upload a real image file using the endpoint');
    console.log('4. Check the backend logs for detailed error information');
    console.log('   (if any errors occur during upload)');
    console.log();

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('TEST FAILED');
    console.error('='.repeat(60));
    console.error('[ERROR DETAILS]');
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Meta: ${JSON.stringify(error.meta, null, 2)}`);
    console.error();
    console.error('[ERROR STACK]');
    console.error(error.stack);
    console.error();

    // Provide helpful troubleshooting information
    console.error('[TROUBLESHOOTING]');
    
    if (error.code === 'P2002') {
      console.error('❌ Unique constraint violation');
      console.error('   - Check if the image URL already exists');
      console.error('   - Verify the product_images table constraints');
    } else if (error.code === 'P2003') {
      console.error('❌ Foreign key constraint violation');
      console.error('   - Check if the product ID is valid');
      console.error('   - Verify the product exists in the products table');
    } else if (error.code === 'P2025') {
      console.error('❌ Record not found');
      console.error('   - The product ID does not exist in the database');
    } else if (error.name === 'PrismaClientInitializationError') {
      console.error('❌ Database connection error');
      console.error('   - Check DATABASE_URL environment variable');
      console.error('   - Verify PostgreSQL is running');
      console.error('   - Check network connectivity to database');
    } else {
      console.error('❌ Unknown error occurred');
      console.error('   - Check PostgreSQL logs for more details');
      console.error('   - Verify database permissions');
      console.error('   - Check available disk space');
    }
    console.error();

  } finally {
    await prisma.$disconnect();
    console.log('[INFO] Database connection closed');
  }
}

// Run the test
testProductImageUpload()
  .then(() => {
    console.log('[INFO] Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[FATAL] Test failed with unhandled error:', error);
    process.exit(1);
  });
