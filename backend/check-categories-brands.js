const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function checkCategoriesAndBrands() {
  try {
    // Check categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        iconUrl: true
      },
      take: 5
    });

    console.log('Categories:');
    console.log(JSON.stringify(categories, null, 2));

    // Check brands
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true
      },
      take: 5
    });

    console.log('\nBrands:');
    console.log(JSON.stringify(brands, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoriesAndBrands();
