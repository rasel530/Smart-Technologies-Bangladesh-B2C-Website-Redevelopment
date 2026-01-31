const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const products = await prisma.product.findMany({
    where: { status: 'active', visibility: 'public' },
    select: { id: true, name: true, isNewArrival: true, isBestSeller: true, isFeatured: true }
  });
  
  console.log('Active Products with Flags:');
  console.log('================================');
  products.forEach(p => {
    console.log(`${p.name}`);
    console.log(`  New Arrival: ${p.isNewArrival}`);
    console.log(`  Best Seller: ${p.isBestSeller}`);
    console.log(`  Featured: ${p.isFeatured}`);
    console.log('');
  });
  
  const counts = {
    newArrivals: products.filter(p => p.isNewArrival).length,
    bestSellers: products.filter(p => p.isBestSeller).length,
    featured: products.filter(p => p.isFeatured).length
  };
  
  console.log('Summary:');
  console.log(`  New Arrivals: ${counts.newArrivals}`);
  console.log(`  Best Sellers: ${counts.bestSellers}`);
  console.log(`  Featured: ${counts.featured}`);
  
  await prisma.$disconnect();
}

verify();
