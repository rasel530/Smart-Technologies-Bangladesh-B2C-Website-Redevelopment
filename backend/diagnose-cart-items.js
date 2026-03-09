/**
 * Check cart 3f06cf28 which has 3 items - is it linked to this customer?
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCart() {
  const cartId = '3f06cf28-0000-0000-0000-000000000000'; // partial ID
  
  try {
    // Look for carts with items that were recently updated
    console.log('Looking for cart with 3 items that was updated recently...\n');
    
    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, nameEn: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log('Recent carts with items:');
    for (const cart of carts) {
      if (cart.items.length > 0) {
        console.log(`\nCart ID: ${cart.id}`);
        console.log(`  Status: ${cart.status}`);
        console.log(`  UserId: ${cart.userId}`);
        console.log(`  SessionId: ${cart.sessionId}`);
        console.log(`  Items (${cart.items.length}):`);
        cart.items.forEach((item, idx) => {
          console.log(`    ${idx+1}. ${item.product?.name || item.productId} - Qty: ${item.quantity}, Price: ${item.price}`);
        });
      }
    }
    
    // Also search by phone number in any related data
    console.log('\n\nSearching for any data linked to phone 01914287530...');
    
    // Check addresses
    const addresses = await prisma.address.findMany({
      where: { phone: '01914287530' }
    });
    console.log(`\nAddresses with phone 01914287530: ${addresses.length}`);
    
    // Check orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { paymentDetails: { path: ['phone'], equals: '01914287530' } },
          { address: { phone: '01914287530' } }
        ]
      }
    });
    console.log(`Orders with phone 01914287530: ${orders.length}`);
    for (const order of orders) {
      console.log(`  - ${order.orderNumber}: ${order.status}, Total: ${order.total}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCart();
