const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductBrandDetails() {
  try {
    // Get the product with its category and brand details
    const product = await prisma.product.findFirst({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        brand: true
      }
    });

    console.log('Product Details:');
    console.log(JSON.stringify(product, null, 2));

    // Get the HP brand details
    const hpBrand = await prisma.brand.findFirst({
      where: { slug: 'hp' }
    });

    console.log('\nHP Brand Details:');
    console.log(JSON.stringify(hpBrand, null, 2));

    // Get all brands to see what's available
    const allBrands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('\nAll Available Brands:');
    allBrands.forEach(brand => {
      console.log(`  ${brand.name} (${brand.slug}) - ID: ${brand.id} - Status: ${brand.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductBrandDetails();
