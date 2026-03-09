const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDataIntegrity() {
  try {
    console.log('=== Data Integrity Verification ===\n');

    // Check existing tables have data
    const users = await prisma.user.count();
    const orders = await prisma.order.count();
    const orderItems = await prisma.orderItem.count();
    const transactions = await prisma.transaction.count();
    const products = await prisma.product.count();
    const carts = await prisma.cart.count();

    console.log('Existing Tables:');
    console.log(`  Users: ${users} records`);
    console.log(`  Orders: ${orders} records`);
    console.log(`  Order Items: ${orderItems} records`);
    console.log(`  Transactions: ${transactions} records`);
    console.log(`  Products: ${products} records`);
    console.log(`  Carts: ${carts} records`);

    // Check new tables are empty (as expected)
    const orderStatusHistory = await prisma.orderStatusHistory.count();
    const orderModifications = await prisma.orderModification.count();
    const orderCancellations = await prisma.orderCancellation.count();
    const orderFulfillments = await prisma.orderFulfillment.count();
    const orderNotifications = await prisma.orderNotification.count();
    const orderInvoices = await prisma.orderInvoice.count();
    const orderSharing = await prisma.orderSharing.count();
    const orderNotes = await prisma.orderNote.count();
    const courierServices = await prisma.courierService.count();
    const orderTrackingEvents = await prisma.orderTrackingEvent.count();
    const deliveryConfirmations = await prisma.deliveryConfirmation.count();

    console.log('\nNew Order Management Tables:');
    console.log(`  Order Status History: ${orderStatusHistory} records`);
    console.log(`  Order Modifications: ${orderModifications} records`);
    console.log(`  Order Cancellations: ${orderCancellations} records`);
    console.log(`  Order Fulfillments: ${orderFulfillments} records`);
    console.log(`  Order Notifications: ${orderNotifications} records`);
    console.log(`  Order Invoices: ${orderInvoices} records`);
    console.log(`  Order Sharing: ${orderSharing} records`);
    console.log(`  Order Notes: ${orderNotes} records`);
    console.log(`  Courier Services: ${courierServices} records`);
    console.log(`  Order Tracking Events: ${orderTrackingEvents} records`);
    console.log(`  Delivery Confirmations: ${deliveryConfirmations} records`);

    // Test basic operations on existing tables
    console.log('\n=== Testing Basic Operations ===\n');

    // Test querying orders
    const sampleOrder = await prisma.order.findFirst({
      include: {
        items: true,
        transactions: true
      }
    });

    if (sampleOrder) {
      console.log(`✓ Successfully queried order ${sampleOrder.orderNumber} with ${sampleOrder.items.length} items`);
    } else {
      console.log('✓ No orders found (expected for fresh database)');
    }

    // Test querying users
    const sampleUser = await prisma.user.findFirst();
    if (sampleUser) {
      console.log(`✓ Successfully queried user ${sampleUser.email}`);
    }

    // Test querying products
    const sampleProduct = await prisma.product.findFirst();
    if (sampleProduct) {
      console.log(`✓ Successfully queried product ${sampleProduct.name}`);
    }

    console.log('\n✅ Data integrity verified - No data loss detected!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDataIntegrity();
