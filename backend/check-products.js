const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('Checking products in database...\n');

    // Count total products
    const totalCount = await prisma.product.count();
    console.log(`Total products in database: ${totalCount}`);

    // Count active products
    const activeCount = await prisma.product.count({
      where: { status: 'active' }
    });
    console.log(`Active products: ${activeCount}`);

    // Count public products
    const publicCount = await prisma.product.count({
      where: { visibility: 'public' }
    });
    console.log(`Public products: ${publicCount}`);

    // Get sample products
    const products = await prisma.product.findMany({
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
    console.log(JSON.stringify(products, null, 2));

  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
