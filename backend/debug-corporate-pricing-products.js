const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorporatePricingQuery(testAccountId) {
  const accountId = '83fbff07-2859-425b-bbe2-26478d548fe0';
  console.log('[DEBUG] Testing corporate pricing query for account:', accountId);

  try {
    // Test 1: Check if corporate account exists
    console.log('[DEBUG] Test 1: Checking if corporate account exists...');
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: testAccountId }
    });
    console.log('[DEBUG] Corporate account found:', !!corporateAccount);
    if (corporateAccount) {
      console.log('[DEBUG] Corporate account details:', {
        id: corporateAccount.id,
        companyName: corporateAccount.companyName,
        accountStatus: corporateAccount.accountStatus
      });
    }

    // Test 2: Check if there are products
    console.log('[DEBUG] Test 2: Checking if products exist...');
    const productCount = await prisma.product.count();
    console.log('[DEBUG] Total products:', productCount);

    // Test 3: Try to query products with corporate pricing (similar to endpoint)
    console.log('[DEBUG] Test 3: Querying products with corporate pricing...');
    const products = await prisma.product.findMany({
      include: {
        corporate_pricing: {
          where: {
            corporateAccountId: accountId,
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } }
            ]
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5
    });
    console.log('[DEBUG] Products found:', products.length);
    console.log('[DEBUG] First product:', products[0] ? {
      id: products[0].id,
      name: products[0].name,
      corporatePricingCount: products[0].corporate_pricing?.length || 0
    } : 'No products');

    // Test 4: Check if there's any corporate pricing for this account
    console.log('[DEBUG] Test 4: Checking corporate pricing for account...');
    const corporatePricingCount = await prisma.corporatePricing.count({
      where: { corporateAccountId }
    });
    console.log('[DEBUG] Corporate pricing records:', corporatePricingCount);

    console.log('[DEBUG] All tests passed successfully!');
  } catch (error) {
    console.error('[ERROR] Test failed with error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

testCorporatePricingQuery();
