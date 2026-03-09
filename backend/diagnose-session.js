/**
 * Diagnostic script to query the specific session and understand why cart is empty
 * Session ID: b826da20-eeeb-4941-b556-fb2142f21ec8
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function diagnoseSession() {
  console.log('=== GUEST CHECKOUT SESSION DIAGNOSTIC ===\n');
  
  const sessionId = 'b826da20-eeeb-4941-b556-fb2142f21ec8';
  
  try {
    // Query 1: Check for GuestSession
    console.log('1. Looking for GuestSession with sessionId:', sessionId);
    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionId: sessionId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, nameEn: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (guestSession) {
      console.log('✅ GuestSession found!');
      console.log('   - GuestSession ID:', guestSession.id);
      console.log('   - Cart ID:', guestSession.cartId);
      console.log('   - First Name:', guestSession.firstName);
      console.log('   - Last Name:', guestSession.lastName);
      console.log('   - Email:', guestSession.email);
      console.log('   - Phone:', guestSession.phone);
      console.log('   - Expires At:', guestSession.expiresAt);
      console.log('   - Cart Status:', guestSession.cart?.status);
      console.log('   - Cart Items Count:', guestSession.cart?.items?.length || 0);
      
      if (guestSession.cart?.items?.length > 0) {
        console.log('\n   Cart Items:');
        guestSession.cart.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.product?.name || 'Product ID: ' + item.productId}`);
          console.log(`      - Quantity: ${item.quantity}`);
          console.log(`      - Price: ${item.price}`);
          console.log(`      - Subtotal: ${item.subtotal}`);
        });
      } else {
        console.log('\n   ⚠️ CART IS EMPTY!');
      }
    } else {
      console.log('❌ GuestSession NOT found');
    }
    
    // Query 2: Check for CheckoutSession (alternative)
    console.log('\n2. Looking for CheckoutSession with id:', sessionId);
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        cart: {
          include: {
            items: true
          }
        }
      }
    });
    
    if (checkoutSession) {
      console.log('✅ CheckoutSession found!');
      console.log('   - Cart ID:', checkoutSession.cartId);
      console.log('   - Cart Items Count:', checkoutSession.cart?.items?.length || 0);
    } else {
      console.log('❌ CheckoutSession NOT found');
    }
    
    // Query 3: Look for ALL carts with recent activity (to find if items went somewhere else)
    console.log('\n3. Looking for recent carts (last 30 minutes)...');
    const recentCarts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`   Found ${recentCarts.length} recent carts:`);
    for (const cart of recentCarts.slice(0, 10)) {
      console.log(`   - Cart ${cart.id.slice(0,8)}: ${cart.items.length} items, status: ${cart.status}, userId: ${cart.userId || 'null'}`);
    }
    
    // Query 4: Look for all carts without userId (guest carts)
    console.log('\n4. Looking for guest carts with items...');
    const guestCartsWithItems = await prisma.cart.findMany({
      where: {
        userId: null,
        status: 'active'
      },
      include: {
        items: true
      }
    });
    
    console.log(`   Found ${guestCartsWithItems.length} guest carts with items:`);
    for (const cart of guestCartsWithItems.slice(0, 10)) {
      console.log(`   - Cart ${cart.id.slice(0,8)}: ${cart.items.length} items`);
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSession();
