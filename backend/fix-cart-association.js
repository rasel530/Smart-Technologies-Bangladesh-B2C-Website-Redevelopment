/**
 * Check order ORD1772009423668330 to understand what happened
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrder() {
  const orderNumber = 'ORD1772009423668330';
  
  try {
    // Get the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });
    
    if (!order) {
      console.log('Order not found!');
      return;
    }
    
    console.log('Order:', order.orderNumber);
    console.log('Status:', order.status);
    console.log('Total:', order.total);
    console.log('Items count:', order.items.length);
    console.log('PaymentDetails:', JSON.stringify(order.paymentDetails, null, 2));
    
    // Check address
    if (order.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: order.addressId }
      });
      console.log('\nAddress:', address);
    }
    
    // Look for guest sessions with this phone number
    console.log('\n=== Looking for guest sessions with this customer ===');
    const phone = '01914287530';
    const guestSessions = await prisma.guestSession.findMany({
      where: {
        OR: [
          { phone },
          { email: 'raselbepari88@gmail.com' }
        ]
      },
      include: {
        cart: {
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${guestSessions.length} guest sessions:`);
    for (const gs of guestSessions.slice(0, 10)) {
      console.log(`\n- Session: ${gs.sessionId}`);
      console.log(`  Cart: ${gs.cartId}`);
      console.log(`  Cart items: ${gs.cart?.items?.length || 0}`);
      console.log(`  Created: ${gs.createdAt}`);
      console.log(`  Expires: ${gs.expiresAt}`);
    }
    
    // Now let's fix: Find the cart with items for this customer and update the session
    console.log('\n=== Looking for cart with items to fix ===');
    
    // Get cart 3f06cf28 which has items
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: '3f06cf28-35d4-4976-b6a8-8ce0f8bc9f7d' },
      include: { items: true }
    });
    
    if (cartWithItems) {
      console.log(`Cart ${cartWithItems.id} has ${cartWithItems.items.length} items`);
      
      // Now update the guest session to use this cart
      const guestSessionToFix = await prisma.guestSession.findUnique({
        where: { sessionId: 'b826da20-eeeb-4941-b556-fb2142f21ec8' }
      });
      
      if (guestSessionToFix) {
        console.log(`\n=== FIXING: Updating guest session cart from ${guestSessionToFix.cartId} to ${cartWithItems.id} ===`);
        
        await prisma.guestSession.update({
          where: { id: guestSessionToFix.id },
          data: { cartId: cartWithItems.id }
        });
        
        console.log('✅ Guest session cart updated!');
        
        // Verify
        const updatedSession = await prisma.guestSession.findUnique({
          where: { sessionId: 'b826da20-eeeb-4941-b556-fb2142f21ec8' },
          include: { cart: { include: { items: true } } }
        });
        
        console.log(`\nVerification - Guest session now has cart with ${updatedSession.cart?.items?.length || 0} items`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();
