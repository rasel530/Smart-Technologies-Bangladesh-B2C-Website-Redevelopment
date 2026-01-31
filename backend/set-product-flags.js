/**
 * Set Product Flags Script
 * 
 * This script sets isNewArrival and isBestSeller flags on products
 * to populate the home page sections.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setProductFlags() {
  try {
    console.log('Setting product flags...');

    // Get all active products
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${products.length} active products`);

    if (products.length === 0) {
      console.log('No active products found. Please create some products first.');
      return;
    }

    // Set first 8 products as new arrivals
    const newArrivalsCount = Math.min(8, products.length);
    const newArrivals = products.slice(0, newArrivalsCount);
    
    for (const product of newArrivals) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isNewArrival: true }
      });
    }
    console.log(`✓ Set ${newArrivalsCount} products as New Arrivals`);

    // Set next 8 products (or first 8 if less than 8) as best sellers
    const bestSellersCount = Math.min(8, products.length);
    const bestSellers = products.slice(0, bestSellersCount);
    
    for (const product of bestSellers) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isBestSeller: true }
      });
    }
    console.log(`✓ Set ${bestSellersCount} products as Best Sellers`);

    // Set first 4 products as featured
    const featuredCount = Math.min(4, products.length);
    const featured = products.slice(0, featuredCount);
    
    for (const product of featured) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isFeatured: true }
      });
    }
    console.log(`✓ Set ${featuredCount} products as Featured`);

    console.log('\n✅ Product flags set successfully!');
    console.log('The home page should now display:');
    console.log(`  - ${featuredCount} Featured Products`);
    console.log(`  - ${newArrivalsCount} New Arrivals`);
    console.log(`  - ${bestSellersCount} Best Sellers`);

  } catch (error) {
    console.error('Error setting product flags:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setProductFlags();
