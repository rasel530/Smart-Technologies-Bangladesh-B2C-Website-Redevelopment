const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Checking cart_wishlist_sync table structure...\n');

    // Check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cart_wishlist_sync'
      );
    `;
    const exists = await prisma.$queryRawUnsafe(tableExistsQuery);
    console.log('Table exists:', exists[0].exists ? 'YES' : 'NO');

    if (exists[0].exists) {
      // Get all columns
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'cart_wishlist_sync'
        ORDER BY ordinal_position;
      `;
      const columns = await prisma.$queryRawUnsafe(columnsQuery);
      console.log('\nColumns:', columns.length);
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Try to describe the table
      const describeQuery = `
        SELECT * FROM cart_wishlist_sync LIMIT 0;
      `;
      console.log('\nTrying to query table...');
      await prisma.$queryRawUnsafe(describeQuery);
      console.log('  Table query successful');
    }

  } catch (e) {
    console.error('Error:', e.message);
    console.error('Details:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
