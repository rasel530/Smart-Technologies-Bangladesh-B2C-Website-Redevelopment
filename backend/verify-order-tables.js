const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTables() {
  try {
    // Query for the new order management tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (
          table_name LIKE 'order%' 
          OR table_name LIKE 'courier%' 
          OR table_name LIKE 'delivery%'
        )
      ORDER BY table_name;
    `;

    console.log('\n=== Order Management Tables ===\n');
    console.log(`Total tables found: ${tables.length}\n`);
    
    for (const table of tables) {
      console.log(`  ✓ ${table.table_name}`);
    }

    // Expected tables
    const expectedTables = [
      'order_cancellations',
      'order_fulfillments',
      'order_invoices',
      'order_modifications',
      'order_notes',
      'order_notifications',
      'order_sharing',
      'order_status_history',
      'order_tracking_events',
      'orders',
      'order_items',
      'courier_services',
      'delivery_confirmations'
    ];

    console.log('\n=== Verification ===\n');
    
    const existingTables = tables.map(t => t.table_name);
    let allFound = true;
    
    for (const expected of expectedTables) {
      if (existingTables.includes(expected)) {
        console.log(`  ✓ ${expected} - EXISTS`);
      } else {
        console.log(`  ✗ ${expected} - MISSING`);
        allFound = false;
      }
    }

    console.log('\n' + (allFound ? '✅ All expected tables exist!' : '⚠️ Some tables are missing'));

    // Check if orders table has data
    const orderCount = await prisma.order.count();
    console.log(`\n=== Data Verification ===\n`);
    console.log(`  Orders table: ${orderCount} records`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
