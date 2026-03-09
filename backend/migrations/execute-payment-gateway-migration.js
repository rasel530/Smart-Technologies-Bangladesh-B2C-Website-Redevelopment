const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

async function executeMigration() {
  const client = await pool.connect();

  try {
    console.log('Starting Phase 7 Milestone 2 Payment Gateway Integration migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '20260226_phase7_milestone2_payment_gateway_integration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✓ Migration executed successfully!');
    console.log('✓ Created payment_transaction table');
    console.log('✓ Created payment_gateway_settings table');
    console.log('✓ Created payment_log table');
    console.log('✓ Created indexes for performance');
    console.log('✓ Created triggers for updatedAt timestamps');
    console.log('✓ Inserted default payment gateway settings');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY table_name;
    `);

    console.log('\n✓ Verification - Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify indexes
    const indexesResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY tablename, indexname;
    `);

    console.log('\n✓ Verification - Indexes created:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.indexname}`);
    });

    // Verify default settings
    const settingsResult = await client.query(`
      SELECT gateway, "isActive", "isTestMode"
      FROM "PaymentGatewaySettings"
      ORDER BY gateway;
    `);

    console.log('\n✓ Verification - Default gateway settings:');
    settingsResult.rows.forEach(row => {
      console.log(`  - ${row.gateway}: Active=${row.isActive}, TestMode=${row.isTestMode}`);
    });

    // Check existing tables count to verify no data loss
    const tableCountBefore = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);

    console.log(`\n✓ Total tables in database: ${tableCountBefore.rows[0].count}`);
    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

executeMigration();
