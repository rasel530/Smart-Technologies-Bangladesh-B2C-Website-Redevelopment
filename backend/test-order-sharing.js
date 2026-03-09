/**
 * Test script to check Order Sharing Management functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOrderSharing() {
  console.log('=== Order Sharing Management Test ===\n');

  try {
    // 1. Check OrderSharing table data
    console.log('1. Checking OrderSharing table data...');
    const orderShares = await prisma.orderSharing.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${orderShares.length} order shares in database`);
    if (orderShares.length > 0) {
      console.log('   Sample data:');
      orderShares.slice(0, 3).forEach(share => {
        console.log(`   - ID: ${share.id}`);
        console.log(`     Order ID: ${share.orderId}`);
        console.log(`     Token: ${share.token}`);
        console.log(`     Share Type: ${share.shareType}`);
        console.log(`     Is Active: ${share.isActive}`);
        console.log(`     View Count: ${share.viewCount}`);
        console.log(`     Created At: ${share.createdAt}`);
      });
    } else {
      console.log('   ⚠️  No order shares found in database!');
      console.log('   This is likely why the Order Sharing Management page shows no data.');
    }

    // 2. Check if there are any orders in the database
    console.log('\n2. Checking Orders table...');
    const orders = await prisma.order.findMany({
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${orders.length} orders in database`);
    if (orders.length > 0) {
      console.log('   Sample orders:');
      orders.forEach(order => {
        console.log(`   - Order #${order.orderNumber} (ID: ${order.id})`);
      });
    }

    // 3. Check OrderSharing table structure
    console.log('\n3. Checking OrderSharing table structure...');
    const orderSharingInfo = await prisma.orderSharing.count();
    console.log(`   Total OrderSharing records: ${orderSharingInfo}`);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=== Test Complete ===');
}

testOrderSharing();
