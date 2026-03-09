/**
 * Create Sample Orders with Tracking Numbers
 * 
 * This script creates sample orders with tracking numbers for testing
 * the bulk tracking sync functionality.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleTrackingOrders() {
  try {
    console.log('[Sample Tracking Orders] Starting to create sample orders with tracking...');

    // Get active courier services
    const courierServices = await prisma.courierService.findMany({
      where: { isActive: true }
    });

    if (courierServices.length === 0) {
      console.log('[Sample Tracking Orders] No active courier services found. Please create courier services first.');
      return;
    }

    console.log(`[Sample Tracking Orders] Found ${courierServices.length} active courier services`);

    // Get users to assign orders to
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      take: 5
    });

    if (users.length === 0) {
      console.log('[Sample Tracking Orders] No customer users found. Please create customer users first.');
      return;
    }

    console.log(`[Sample Tracking Orders] Found ${users.length} customer users`);

    // Get products to add to orders
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      take: 10
    });

    if (products.length === 0) {
      console.log('[Sample Tracking Orders] No active products found. Please create products first.');
      return;
    }

    console.log(`[Sample Tracking Orders] Found ${products.length} active products`);

    // Get or create addresses for users
    let addresses = await prisma.address.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      take: 5
    });

    if (addresses.length === 0) {
      console.log('[Sample Tracking Orders] No addresses found. Creating sample addresses...');
      
      const sampleAddresses = [
        {
          userId: users[0].id,
          fullName: users[0].name || 'Test User 1',
          phone: users[0].phone || '01700000001',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Dhaka',
          addressLine: 'House 1, Road 1, Gulshan 1',
          isDefault: true
        },
        {
          userId: users[0].id,
          fullName: users[0].name || 'Test User 1',
          phone: users[0].phone || '01700000001',
          division: 'Chittagong',
          district: 'Chittagong',
          upazila: 'Chittagong',
          addressLine: 'House 2, Road 2, GEC Circle',
          isDefault: false
        }
      ];

      for (const addressData of sampleAddresses) {
        const address = await prisma.address.create({
          data: addressData
        });
        addresses.push(address);
        console.log(`[Sample Tracking Orders] Created address: ${address.addressLine}, ${address.district}`);
      }
    }

    console.log(`[Sample Tracking Orders] Found ${addresses.length} addresses`);

    // Create sample orders
    const orderStatuses = ['confirmed', 'processing', 'shipped'];
    const sampleOrders = [];

    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const address = addresses[i % addresses.length];
      const courierService = courierServices[i % courierServices.length];
      const status = orderStatuses[i % orderStatuses.length];

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${i}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId: address.id,
          status,
          subtotal: Math.floor(Math.random() * 5000) + 1000,
          shippingCost: 60,
          tax: 0,
          discount: 0,
          total: 0, // Will be calculated
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          notes: `Sample order ${i + 1} for testing bulk tracking sync`
        }
      });

      // Calculate total
      const total = order.subtotal + order.shippingCost + order.tax - order.discount;
      await prisma.order.update({
        where: { id: order.id },
        data: { total }
      });

      // Add order items
      const numProducts = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numProducts; j++) {
        const product = products[(i + j) % products.length];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.discountPrice || product.price;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity,
            price,
            total: quantity * price
          }
        });
      }

      // Create fulfillment with tracking number
      const trackingNumber = `${courierService.code}-${Date.now()}-${i}`;
      
      const fulfillment = await prisma.orderFulfillment.create({
        data: {
          orderId: order.id,
          courierServiceId: courierService.id,
          trackingNumber,
          status: status === 'shipped' ? 'in_transit' : 'pending',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      });

      // Create some tracking events for shipped orders
      if (status === 'shipped') {
        await prisma.orderTrackingEvent.create({
          data: {
            orderId: order.id,
            fulfillmentId: fulfillment.id,
            status: 'picked_up',
            description: 'Package picked up from warehouse',
            location: 'Dhaka',
            eventTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        });

        await prisma.orderTrackingEvent.create({
          data: {
            orderId: order.id,
            fulfillmentId: fulfillment.id,
            status: 'in_transit',
            description: 'Package in transit',
            location: 'Dhaka',
            eventTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        });
      }

      sampleOrders.push({
        orderNumber,
        status,
        trackingNumber,
        courierService: courierService.name
      });

      console.log(`[Sample Tracking Orders] Created order: ${orderNumber} (${status}) - Tracking: ${trackingNumber}`);
    }

    console.log('\n[Sample Tracking Orders] Sample orders created successfully!');
    console.log(`\n[Sample Tracking Orders] Summary:`);
    console.log(`  - Total orders created: ${sampleOrders.length}`);
    console.log(`  - Orders with tracking: ${sampleOrders.length}`);
    
    console.log('\n[Sample Tracking Orders] Orders:');
    sampleOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} - ${order.status} - ${order.trackingNumber} (${order.courierService})`);
    });

  } catch (error) {
    console.error('[Sample Tracking Orders] Error creating sample orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleTrackingOrders();
