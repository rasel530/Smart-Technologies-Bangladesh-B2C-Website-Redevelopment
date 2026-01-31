const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrandsAndCategories() {
  try {
    console.log('Checking brands and categories in database...\n');

    // Check all brands
    const allBrands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: { products: true }
        }
      }
    });

    console.log(`Total brands in database: ${allBrands.length}\n`);
    allBrands.forEach((brand, index) => {
      console.log(`Brand ${index + 1}:`);
      console.log(`  Name: ${brand.name}`);
      console.log(`  Status: ${brand.status}`);
      console.log(`  Products: ${brand._count.products}\n`);
    });

    // Check active brands
    const activeBrands = await prisma.brand.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Active brands (status='active'): ${activeBrands.length}`);
    activeBrands.forEach(brand => {
      console.log(`  ✓ ${brand.name}`);
    });

    // Check all categories with product count
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        parentId: true,
        productCategories: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`\nTotal categories in database: ${allCategories.length}\n`);
    allCategories.forEach((category, index) => {
      console.log(`Category ${index + 1}:`);
      console.log(`  Name: ${category.name}`);
      console.log(`  Status: ${category.status}`);
      console.log(`  Parent: ${category.parentId || 'None'}`);
      console.log(`  Products: ${category.productCategories.length}\n`);
    });

    // Check active categories
    const activeCategories = await prisma.category.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        productCategories: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`Active categories (status='active'): ${activeCategories.length}`);
    activeCategories.forEach(category => {
      console.log(`  ✓ ${category.name} (${category.productCategories.length} products)`);
    });

    // Check featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isFeatured: true
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`\nFeatured products: ${featuredProducts.length}`);

    // Check new arrival products
    const newArrivalProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isNewArrival: true
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`New arrival products: ${newArrivalProducts.length}`);

    // Check best seller products
    const bestSellerProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isBestSeller: true
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Best seller products: ${bestSellerProducts.length}`);

  } catch (error) {
    console.error('Error checking brands and categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrandsAndCategories();
