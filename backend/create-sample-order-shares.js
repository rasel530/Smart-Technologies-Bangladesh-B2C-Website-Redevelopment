/**
 * Create sample order sharing data for testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleOrderShares() {
  console.log('=== Creating Sample Order Sharing Data ===\n');

  try {
    // 1. Get existing orders
    console.log('1. Fetching existing orders...');
    const orders = await prisma.order.findMany({
      take: 5,
      select: {
        id: true,
        orderNumber: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      console.log('   No orders found. Please create some orders first.');
      return;
    }

    console.log(`   Found ${orders.length} orders`);

    // 2. Create sample order shares
    console.log('\n2. Creating sample order shares...');
    
    const shareTypes = ['public_link', 'protected_link', 'one_time_link'];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const shareType = shareTypes[i % shareTypes.length];
      
      // Generate a random token
      const token = `share_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      const share = await prisma.orderSharing.create({
        data: {
          orderId: order.id,
          token: token,
          shareType: shareType,
          isActive: true,
          viewCount: Math.floor(Math.random() * 100),
          createdBy: 'system_test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          maxViews: shareType === 'one_time_link' ? 1 : null,
          password: shareType === 'protected_link' ? 'password123' : null
        }
      });

      console.log(`   Created share for Order #${order.orderNumber}:`);
      console.log(`     - Token: ${token}`);
      console.log(`     - Type: ${shareType}`);
      console.log(`     - Views: ${share.viewCount}`);
    }

    // 3. Verify created shares
    console.log('\n3. Verifying created shares...');
    const allShares = await prisma.orderSharing.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Total shares in database: ${allShares.length}`);
    
    if (allShares.length > 0) {
      console.log('\n   Sample shares:');
      allShares.slice(0, 5).forEach(share => {
        console.log(`   - ${share.token} (${share.shareType})`);
      });
    }

    console.log('\n✅ Sample data created successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=== Complete ===');
}

createSampleOrderShares();
