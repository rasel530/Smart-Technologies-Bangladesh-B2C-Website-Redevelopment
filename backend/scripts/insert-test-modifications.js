/**
 * Test Data Insertion Script for Order Modifications
 * 
 * This script inserts sample OrderModification records into the database
 * to verify the admin modifications page displays data correctly after the route fix.
 * 
 * Usage: node backend/scripts/insert-test-modifications.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample order IDs (replace with actual order IDs from your database)
const SAMPLE_ORDER_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005',
];

// Sample user IDs (replace with actual user IDs from your database)
const SAMPLE_USER_IDS = [
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440011',
];

const MODIFICATION_TYPES = [
  'item_add',
  'item_remove',
  'quantity_change',
  'address_change',
  'price_change',
  'shipping_method_change',
  'payment_method_change',
  'custom',
];

const MODIFICATION_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

const SAMPLE_DESCRIPTIONS = {
  item_add: [
    'Customer wants to add HP Laptop to the order',
    'Add additional quantity of Samsung Galaxy S24',
    'Request to add Apple MacBook Pro to existing order',
  ],
  item_remove: [
    'Customer wants to remove the wireless mouse',
    'Remove the extra USB cable from order',
    'Cancel the additional monitor',
  ],
  quantity_change: [
    'Change quantity from 1 to 2',
    'Reduce quantity from 3 to 1',
    'Increase quantity to 5 units',
  ],
  address_change: [
    'Update shipping address to new location',
    'Change delivery address to office',
    'Modify shipping address for better delivery',
  ],
  price_change: [
    'Price adjustment request due to discount',
    'Apply special pricing for bulk order',
    'Update price to match current promotion',
  ],
  shipping_method_change: [
    'Change from standard to express shipping',
    'Switch to economy shipping',
    'Upgrade to priority shipping',
  ],
  payment_method_change: [
    'Switch from credit card to bKash',
    'Change payment method to cash on delivery',
    'Update payment method to bank transfer',
  ],
  custom: [
    'Special packaging request',
    'Gift wrap and message',
    'Combine multiple orders',
  ],
};

const SAMPLE_CHANGES = {
  item_add: {
    productId: 'prod_001',
    quantity: 1,
    price: 999.99,
  },
  item_remove: {
    productId: 'prod_002',
    quantity: 1,
  },
  quantity_change: {
    productId: 'prod_003',
    oldQuantity: 1,
    newQuantity: 2,
  },
  address_change: {
    oldAddress: {
      addressLine1: '123 Old Street',
      city: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1000',
    },
    newAddress: {
      addressLine1: '456 New Avenue',
      city: 'Chittagong',
      district: 'Chittagong',
      postalCode: '4000',
    },
  },
  price_change: {
    productId: 'prod_004',
    oldPrice: 1200.00,
    newPrice: 999.99,
    reason: 'Promotional discount',
  },
  shipping_method_change: {
    oldMethod: 'standard',
    newMethod: 'express',
    additionalCost: 50.00,
  },
  payment_method_change: {
    oldMethod: 'credit_card',
    newMethod: 'bkash',
  },
  custom: {
    requestType: 'special_packaging',
    details: 'Gift wrap with birthday message',
  },
};

/**
 * Generate random modification data
 */
function generateModificationData(index) {
  const type = MODIFICATION_TYPES[Math.floor(Math.random() * MODIFICATION_TYPES.length)];
  const status = MODIFICATION_STATUSES[Math.floor(Math.random() * MODIFICATION_STATUSES.length)];
  const descriptions = SAMPLE_DESCRIPTIONS[type];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
  
  const processedAt = status !== 'pending' ? new Date(createdAt) : undefined;
  
  const approvedBy = status === 'approved' || status === 'completed' 
    ? SAMPLE_USER_IDS[Math.floor(Math.random() * SAMPLE_USER_IDS.length)]
    : undefined;

  return {
    orderId: SAMPLE_ORDER_IDS[Math.floor(Math.random() * SAMPLE_ORDER_IDS.length)],
    modificationType: type,
    description,
    changes: SAMPLE_CHANGES[type],
    status,
    requestedBy: SAMPLE_USER_IDS[Math.floor(Math.random() * SAMPLE_USER_IDS.length)],
    approvedBy,
    processedAt,
    createdAt,
  };
}

/**
 * Insert test modifications
 */
async function insertTestModifications() {
  console.log('🚀 Starting test data insertion for Order Modifications...\n');

  try {
    // Check if modifications table exists and is accessible
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_modifications'
      )
    `;

    if (!tableExists[0].exists) {
      console.error('❌ Error: order_modifications table does not exist!');
      console.log('Please ensure the database schema is up to date.\n');
      process.exit(1);
    }

    // Count existing modifications
    const existingCount = await prisma.orderModification.count();
    console.log(`📊 Existing modifications count: ${existingCount}\n`);

    // Generate 20 test modifications
    const modifications = Array.from({ length: 20 }, (_, index) => 
      generateModificationData(index)
    );

    console.log('📝 Generated 20 sample modification records:\n');
    
    // Display sample data
    console.log('Sample modifications to be inserted:');
    modifications.slice(0, 3).forEach((mod, index) => {
      console.log(`  ${index + 1}. Type: ${mod.modificationType}, Status: ${mod.status}, Order: ${mod.orderId}`);
      console.log(`     Description: ${mod.description}`);
      console.log('');
    });
    console.log(`... and ${modifications.length - 3} more records\n`);

    // Insert modifications
    console.log('💾 Inserting modifications into database...\n');
    
    const insertedModifications = await prisma.orderModification.createMany({
      data: modifications,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully inserted ${insertedModifications.count} modifications!\n`);

    // Display statistics
    const totalCount = await prisma.orderModification.count();
    const stats = await prisma.orderModification.groupBy({
      by: ['status', 'modificationType'],
      _count: true,
    });

    console.log('📈 Statistics after insertion:\n');
    console.log(`Total modifications: ${totalCount}\n`);

    console.log('By Status:');
    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat.status] = (statusCounts[stat.status] || 0) + stat._count;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nBy Type:');
    const typeCounts = {};
    stats.forEach(stat => {
      typeCounts[stat.modificationType] = (typeCounts[stat.modificationType] || 0) + stat._count;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n✨ Test data insertion completed successfully!\n');
    console.log('🔍 You can now verify the admin modifications page at:');
    console.log('   http://localhost:3000/admin/orders/modifications\n');

  } catch (error) {
    console.error('❌ Error inserting test modifications:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
insertTestModifications();
