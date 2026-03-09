const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

async function checkOrdersTable() {
  const client = await pool.connect();

  try {
    console.log('Checking orders table structure...\n');

    // Get column information
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.log('Orders table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    console.log(`\nOrders table exists: ${tableExists.rows[0].exists}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

checkOrdersTable();
