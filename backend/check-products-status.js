const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('Checking all products in database...\n');

    // Get all products without filters
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        sku: true,
        status: true,
        visibility: true,
        regularPrice: true,
        stockQuantity: true,
        createdAt: true
      }
    });

    console.log(`Total products in database: ${allProducts.length}\n`);

    if (allProducts.length === 0) {
      console.log('No products found in database!');
      return;
    }

    // Display all products
    allProducts.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name} (${product.nameEn})`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  Status: ${product.status}`);
      console.log(`  Visibility: ${product.visibility}`);
      console.log(`  Price: ${product.regularPrice}`);
      console.log(`  Stock: ${product.stockQuantity}`);
      console.log(`  Created: ${product.createdAt}\n`);
    });

    // Check how many products match the active/public filter
    const activePublicProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public'
      },
      select: {
        id: true,
        name: true,
        status: true,
        visibility: true
      }
    });

    console.log(`\nProducts with status='active' AND visibility='public': ${activePublicProducts.length}`);
    activePublicProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`);
    });

    // Count products by status
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: true
    });
    console.log('\nProducts by status:');
    statusCounts.forEach(item => {
      console.log(`  ${item.status}: ${item._count}`);
    });

    // Count products by visibility
    const visibilityCounts = await prisma.product.groupBy({
      by: ['visibility'],
      _count: true
    });
    console.log('\nProducts by visibility:');
    visibilityCounts.forEach(item => {
      console.log(`  ${item.visibility}: ${item._count}`);
    });

  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
