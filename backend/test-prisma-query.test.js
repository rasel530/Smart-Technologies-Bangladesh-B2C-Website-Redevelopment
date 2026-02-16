const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaQuery() {
  try {
    console.log('=== Testing Prisma Cart Query ===\n');

    const cartId = 'b0412420-3075-4c7d-ae50-1e5abe2d073b';

    console.log('Testing cart query with full includes...');

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: { id: true, url: true, altTextEn: true, altTextBn: true }
                }
              }
            },
            variant: true
          },
          orderBy: { addedAt: 'desc' }
        },
        analytics: true
      }
    });

    if (cart) {
      console.log('✅ Cart retrieved successfully!');
      console.log('   Cart ID:', cart.id);
      console.log('   Status:', cart.status);
      console.log('   User:', cart.user ? cart.user.email : 'N/A');
      console.log('   Items:', cart.items.length);
      console.log('   Analytics:', cart.analytics ? 'Yes' : 'No');
    } else {
      console.log('⚠️  Cart not found (will return 404)');
    }

  } catch (error) {
    console.error('\n❌ ERROR in Prisma query:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error meta:', JSON.stringify(error.meta, null, 2));
    console.error('\n   Stack trace:');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaQuery();
