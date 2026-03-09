/**
 * FIX: Order Items Not Being Saved - Extended Search & Recovery
 * 
 * This script searches more broadly for cart/checkout session data
 * to find the original items.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAndFixOrder() {
  console.log('=== EXTENDED SEARCH FOR ORDER ITEMS ===\n');
  
  const orderId = '6332751d-063c-4ae4-87cd-1e3c8c7205c0';
  const orderNumber = 'ORD1772009423668330';
  
  // Get order details first
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  console.log('Order:', order.orderNumber);
  console.log('Created at:', order.createdAt);
  console.log('Address ID:', order.addressId);
  
  // Find address to get phone/email for matching
  const address = await prisma.address.findUnique({
    where: { id: order.addressId }
  });
  
  console.log('\nCustomer:', address.firstName, address.lastName);
  console.log('Phone:', address.phone);
  
  // Search for any cart items that might match this customer
  // Look for recent carts with same phone number or guest sessions
  console.log('\n=== SEARCHING FOR CART ITEMS ===');
  
  // Method 1: Search for carts with items and check if any were converted
  const recentCarts = await prisma.cart.findMany({
    where: {
      updatedAt: {
        gte: new Date(order.createdAt.getTime() - 300000), // 5 minutes before order
        lte: new Date(order.createdAt.getTime() + 300000)  // 5 minutes after
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  console.log('\n1. Recent carts found:', recentCarts.length);
  for (const cart of recentCarts) {
    console.log(`   Cart ${cart.id.slice(0,8)} - Status: ${cart.status}, Items: ${cart.items.length}`);
  }
  
  // Method 2: Look for any checkout session linked to this order
  const checkoutSession = await prisma.checkoutSession.findFirst({
    where: {
      orderId: orderId
    },
    include: {
      cart: {
        include: { items: true }
      }
    }
  });
  
  console.log('\n2. Checkout session:', checkoutSession ? 'Found' : 'Not found');
  
  // Method 3: Search by address phone - find carts with this phone in metadata
  const guestSessions = await prisma.guestSession.findMany({
    where: {
      OR: [
        { phone: address.phone },
        { metadata: { path: ['phone'], equals: address.phone } }
      ]
    },
    include: {
      cart: {
        include: { items: true }
      }
    }
  });
  
  console.log('\n3. Guest sessions with same phone:', guestSessions.length);
  for (const gs of guestSessions) {
    console.log(`   Session ${gs.id.slice(0,8)} - Cart items: ${gs.cart?.items?.length || 0}`);
    if (gs.cart?.items?.length > 0) {
      console.log('   FOUND ITEMS IN GUEST SESSION CART!');
      gs.cart.items.forEach(item => {
        console.log(`      - ${item.product?.name}: ${item.quantity} x ${item.price}`);
      });
      
      // Restore these items to the order
      const restoredItems = gs.cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        totalPrice: parseFloat(item.subtotal || (item.price * item.quantity)),
        variantId: item.variantId
      }));
      
      const subtotal = restoredItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.05;
      const shippingCost = subtotal >= 5000 ? 0 : 100;
      const total = subtotal + tax + shippingCost;
      
      console.log('\n   Restoring order with:');
      console.log(`   Subtotal: ${subtotal}, Tax: ${tax}, Shipping: ${shippingCost}, Total: ${total}`);
      
      await prisma.$transaction(async (tx) => {
        // Delete any existing items
        await tx.orderItem.deleteMany({ where: { orderId } });
        
        // Create order items
        for (const item of restoredItems) {
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              variantId: item.variantId || null
            }
          });
        }
        
        // Update order totals
        await tx.order.update({
          where: { id: orderId },
          data: { subtotal, tax, shippingCost, total }
        });
      });
      
      console.log('   ✓ Order restored successfully!');
      break;
    }
  }
  
  // Final verification
  console.log('\n=== FINAL VERIFICATION ===');
  const fixedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });
  
  console.log('Items:', fixedOrder.items.length);
  console.log('Subtotal:', fixedOrder.subtotal);
  console.log('Total:', fixedOrder.total);
  
  if (fixedOrder.items.length > 0) {
    console.log('\nRestored Items:');
    fixedOrder.items.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.product?.name} - Qty: ${item.quantity}, Price: ৳${item.unitPrice}`);
    });
  } else {
    console.log('\n⚠ Could not find original items. Manual intervention needed.');
    console.log('   The cart items were permanently lost.');
  }
  
  await prisma.$disconnect();
}

findAndFixOrder().catch(console.error);
