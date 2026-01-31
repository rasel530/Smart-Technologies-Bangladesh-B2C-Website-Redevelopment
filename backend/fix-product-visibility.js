/**
 * Fix Product Visibility Script
 * 
 * This script:
 * 1. Queries the database to check all products and their status/visibility
 * 2. Updates all published products to have visibility='public'
 * 
 * Run with: node fix-product-visibility.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('PRODUCT VISIBILITY FIX SCRIPT');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Query all products and display their status/visibility
  console.log('Step 1: Querying all products...');
  console.log('-'.repeat(60));
  
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      status: true,
      visibility: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total products in database: ${allProducts.length}`);
  console.log();

  // Display products grouped by status
  console.log('Products by status:');
  console.log('-'.repeat(60));
  
  const statusGroups = {};
  allProducts.forEach(product => {
    if (!statusGroups[product.status]) {
      statusGroups[product.status] = [];
    }
    statusGroups[product.status].push(product);
  });

  Object.keys(statusGroups).forEach(status => {
    console.log(`\nStatus: ${status.toUpperCase()} (${statusGroups[status].length} products)`);
    statusGroups[status].forEach(product => {
      console.log(`  - ID: ${product.id}`);
      console.log(`    SKU: ${product.sku}`);
      console.log(`    Name: ${product.name}`);
      console.log(`    Visibility: ${product.visibility}`);
      console.log();
    });
  });

  // Step 2: Identify published products with visibility != 'public'
  console.log('='.repeat(60));
  console.log('Step 2: Identifying published products with visibility != "public"...');
  console.log('-'.repeat(60));
  
  const publishedProducts = allProducts.filter(p => p.status === 'published');
  console.log(`Total published products: ${publishedProducts.length}`);
  console.log();

  const publishedNonPublic = publishedProducts.filter(p => p.visibility !== 'public');
  
  if (publishedNonPublic.length === 0) {
    console.log('✓ All published products already have visibility="public"');
    console.log('No updates needed.');
  } else {
    console.log(`Found ${publishedNonPublic.length} published products with visibility != "public":`);
    console.log();
    
    publishedNonPublic.forEach(product => {
      console.log(`  - ID: ${product.id}`);
      console.log(`    SKU: ${product.sku}`);
      console.log(`    Name: ${product.name}`);
      console.log(`    Current visibility: ${product.visibility}`);
      console.log();
    });

    // Step 3: Update published products to have visibility='public'
    console.log('='.repeat(60));
    console.log('Step 3: Updating published products to visibility="public"...');
    console.log('-'.repeat(60));

    for (const product of publishedNonPublic) {
      console.log(`Updating product: ${product.name} (${product.sku})`);
      
      await prisma.product.update({
        where: { id: product.id },
        data: { visibility: 'public' }
      });
      
      console.log(`  ✓ Updated visibility from "${product.visibility}" to "public"`);
      console.log();
    }

    console.log(`✓ Successfully updated ${publishedNonPublic.length} products`);
  }

  // Step 4: Verify the updates
  console.log('='.repeat(60));
  console.log('Step 4: Verification - Checking updated products...');
  console.log('-'.repeat(60));

  const updatedProducts = await prisma.product.findMany({
    where: {
      status: 'published'
    },
    select: {
      id: true,
      sku: true,
      name: true,
      status: true,
      visibility: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total published products after update: ${updatedProducts.length}`);
  console.log();

  const publicPublished = updatedProducts.filter(p => p.visibility === 'public');
  console.log(`Published products with visibility="public": ${publicPublished.length}`);
  
  const nonPublicPublished = updatedProducts.filter(p => p.visibility !== 'public');
  console.log(`Published products with visibility!="public": ${nonPublicPublished.length}`);

  if (nonPublicPublished.length > 0) {
    console.log();
    console.log('WARNING: Some published products still have non-public visibility:');
    nonPublicPublished.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}): ${product.visibility}`);
    });
  } else {
    console.log();
    console.log('✓ SUCCESS: All published products now have visibility="public"');
  }

  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total products in database: ${allProducts.length}`);
  console.log(`Published products: ${publishedProducts.length}`);
  console.log(`Published products updated: ${publishedNonPublic.length}`);
  console.log(`Published products with visibility="public": ${publicPublished.length}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
