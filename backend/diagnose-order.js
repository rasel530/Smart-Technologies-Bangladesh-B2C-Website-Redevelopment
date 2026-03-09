// Diagnostic script to query order ORD1772009423668330
// This will help identify if the issue is with data storage or retrieval

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function diagnoseOrder() {
  console.log('=== ORDER DIAGNOSTIC REPORT ===\n');
  
  const orderNumber = 'ORD1772009423668330';
  
  try {
    // Query 1: Find order by order number
    console.log('1. Querying order by orderNumber...');
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        transactions: true
      }
    });
    
    if (!order) {
      console.log('❌ ORDER NOT FOUND in database!');
      console.log('\nThis indicates the order was never created or was created with a different order number.');
      return;
    }
    
    console.log('✅ Order found in database!\n');
    
    // Display order details
    console.log('=== ORDER DETAILS ===');
    console.log('Order ID:', order.id);
    console.log('Order Number:', order.orderNumber);
    console.log('User ID:', order.userId);
    console.log('Address ID:', order.addressId);
    console.log('Status:', order.status);
    console.log('Payment Method:', order.paymentMethod);
    console.log('Payment Status:', order.paymentStatus);
    console.log('');
    console.log('=== PRICING ===');
    console.log('Subtotal:', order.subtotal);
    console.log('Tax:', order.tax);
    console.log('Shipping Cost:', order.shippingCost);
    console.log('Discount:', order.discount);
    console.log('Total:', order.total);
    console.log('');
    console.log('=== ITEMS COUNT ===');
    console.log('Number of items:', order.items.length);
    
    if (order.items.length > 0) {
      console.log('\n=== ORDER ITEMS ===');
      order.items.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log('  - Product ID:', item.productId);
        console.log('  - Product Name:', item.product?.name || 'N/A');
        console.log('  - Variant ID:', item.variantId);
        console.log('  - Quantity:', item.quantity);
        console.log('  - Unit Price:', item.unitPrice);
        console.log('  - Total Price:', item.totalPrice);
      });
    } else {
      console.log('\n⚠️  NO ITEMS FOUND IN ORDER!');
      console.log('This is the root cause of the display issue.');
    }
    
    // Query 2: Check if there are any order_items records with this order ID
    console.log('\n=== RAW ORDER ITEMS CHECK ===');
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    });
    console.log('Raw order items count:', orderItems.length);
    
    // Query 3: Check payment details
    console.log('\n=== PAYMENT DETAILS ===');
    console.log('Payment Details:', JSON.stringify(order.paymentDetails, null, 2));
    
    // Query 4: Check address
    console.log('\n=== ADDRESS ===');
    console.log('Address:', JSON.stringify(order.address, null, 2));
    
  } catch (error) {
    console.error('Error querying order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseOrder();
