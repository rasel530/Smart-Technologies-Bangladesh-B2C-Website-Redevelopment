const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaQuery() {
  console.log('[TEST] Testing Prisma query with validTo field...');
  
  try {
    // Test query using the correct field name 'validTo'
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'corporate_pricing' 
      AND column_name IN ('valid_from', 'valid_to')
    `;
    
    console.log('[TEST] Database columns for corporate_pricing table:');
    console.table(result);
    
    // Test Prisma query with validTo
    console.log('\n[TEST] Testing Prisma query with validTo (camelCase)...');
    const products = await prisma.product.findMany({
      take: 1,
      include: {
        corporate_pricing: {
          where: {
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } }
            ]
          }
        }
      }
    });
    
    console.log('[TEST] SUCCESS: Query with validTo field executed successfully');
    console.log(`[TEST] Found ${products.length} product(s)`);
    
    if (products.length > 0) {
      console.log('[TEST] Sample product:', {
        id: products[0].id,
        name: products[0].name,
        hasCorporatePricing: products[0].corporate_pricing.length > 0
      });
    }
    
  } catch (error) {
    console.error('[TEST] ERROR:', error.message);
    console.error('[TEST] Error details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaQuery();
