const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('=== Checking Products Table ===\n');

    // Check if products table exists by querying it
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}`);

    if (totalProducts === 0) {
      console.log('\n❌ No products found in the database!');
      console.log('This is likely why products are not displaying on the frontend.');
    } else {
      // Get sample products
      const sampleProducts = await prisma.product.findMany({
        take: 5,
        include: {
          brand: true,
          categories: {
            include: {
              category: true
            }
          },
          images: true
        }
      });

      console.log('\nSample products:');
      sampleProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name} (SKU: ${product.sku})`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Visibility: ${product.visibility}`);
        console.log(`   Price: ${product.regularPrice}`);
        console.log(`   Stock: ${product.stockQuantity}`);
        console.log(`   Brand: ${product.brand?.name || 'N/A'}`);
        console.log(`   Categories: ${product.categories.map(pc => pc.category.name).join(', ') || 'None'}`);
        console.log(`   Images: ${product.images.length}`);
      });

      // Check product statuses
      const statusCounts = await prisma.product.groupBy({
        by: ['status'],
        _count: true
      });
      console.log('\n\nProducts by status:');
      statusCounts.forEach(sc => {
        console.log(`  ${sc.status}: ${sc._count}`);
      });

      // Check product visibility
      const visibilityCounts = await prisma.product.groupBy({
        by: ['visibility'],
        _count: true
      });
      console.log('\nProducts by visibility:');
      visibilityCounts.forEach(vc => {
        console.log(`  ${vc.visibility}: ${vc._count}`);
      });
    }

    // Check if brands exist
    const totalBrands = await prisma.brand.count();
    console.log(`\n\nTotal brands in database: ${totalBrands}`);

    // Check if categories exist
    const totalCategories = await prisma.category.count();
    console.log(`Total categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('Error checking database:', error.message);
    if (error.code === 'P2021') {
      console.error('\n❌ The products table does not exist in the database!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
