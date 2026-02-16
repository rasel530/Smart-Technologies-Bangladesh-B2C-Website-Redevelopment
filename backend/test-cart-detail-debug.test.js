const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCartDetail() {
  try {
    console.log('=== Cart Detail Debug Test ===\n');

    const cartId = 'b0412420-3075-4c7d-ae50-1e5abe2d073b';

    // Test 1: Simple cart query
    console.log('Test 1: Simple cart query...');
    const simpleCart = await prisma.cart.findUnique({
      where: { id: cartId }
    });
    console.log('✅ Simple cart query successful');
    console.log('Cart:', JSON.stringify(simpleCart, null, 2));

    // Test 2: Cart with user
    console.log('\nTest 2: Cart with user...');
    const cartWithUser = await prisma.cart.findUnique({
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
        }
      }
    });
    console.log('✅ Cart with user query successful');
    console.log('User:', cartWithUser.user);

    // Test 3: Cart with items
    console.log('\nTest 3: Cart with items...');
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                nameBn: true,
                sku: true
              }
            }
          },
          variant: true
        },
        orderBy: { addedAt: 'desc' }
      }
    });
    console.log('✅ Cart with items query successful');
    console.log('Items count:', cartWithItems.items.length);

    // Test 4: Cart with items and product images
    console.log('\nTest 4: Cart with items and product images...');
    const cartWithImages = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: { id: true, originalUrl: true, altTextEn: true, altTextBn: true }
                }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    });
    console.log('✅ Cart with items and images query successful');
    if (cartWithImages.items.length > 0) {
      const firstItem = cartWithImages.items[0];
      if (firstItem.product && firstItem.product.images) {
        console.log('First item images:', firstItem.product.images);
      }
    }

    // Test 5: Full cart query (same as controller)
    console.log('\nTest 5: Full cart query (same as controller)...');
    const fullCart = await prisma.cart.findUnique({
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
                  select: { id: true, originalUrl: true, altTextEn: true, altTextBn: true }
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
    console.log('✅ Full cart query successful');
    console.log('Cart data:', JSON.stringify(fullCart, null, 2));

    console.log('\n=== All Tests Passed ===');
    console.log('✅ Database queries work correctly');
    console.log('✅ The issue is likely in the API endpoint or middleware');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Meta:', error.meta);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCartDetail();
