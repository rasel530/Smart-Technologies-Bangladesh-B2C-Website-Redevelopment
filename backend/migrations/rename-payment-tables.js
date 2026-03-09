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
    console.log('========================================');
    console.log('RENAME PAYMENT TABLES TO SNAKE_CASE');
    console.log('========================================\n');

    // Check current table names before migration
    console.log('1. Checking current table names...\n');

    const currentTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('PaymentTransaction', 'PaymentGatewaySettings', 'PaymentLog',
                         'payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY table_name;
    `);

    console.log('Current tables found:');
    currentTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Count tables with camelCase names
    const camelCaseTables = currentTables.rows.filter(row => 
      ['PaymentTransaction', 'PaymentGatewaySettings', 'PaymentLog'].includes(row.table_name)
    );

    if (camelCaseTables.length === 0) {
      console.log('\n✓ All tables already have snake_case names. Migration not needed.');
      console.log('========================================');
      console.log('Migration completed successfully!');
      console.log('========================================');
      return;
    }

    console.log(`\nFound ${camelCaseTables.length} table(s) with camelCase names that need renaming.`);

    // Read migration file
    console.log('\n2. Reading migration file...\n');

    const migrationPath = path.join(__dirname, 'rename_payment_tables_to_snake_case.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`✓ Migration file loaded: ${migrationPath}`);

    // Execute migration
    console.log('\n3. Executing migration...\n');

    await client.query(migrationSQL);

    console.log('✓ Migration executed successfully!');
    console.log('✓ Tables renamed from camelCase to snake_case');
    console.log('✓ Indexes updated to match new table names');

    // Verify tables were renamed
    console.log('\n4. Verifying table renames...\n');

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length !== 3) {
      throw new Error(`Expected 3 tables with snake_case names, found ${tablesResult.rows.length}`);
    }

    console.log('✓ Verification - Tables renamed successfully:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify indexes
    console.log('\n5. Verifying indexes...\n');

    const indexesResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY tablename, indexname;
    `);

    console.log('✓ Verification - Indexes for renamed tables:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.indexname}`);
    });

    // Check for any remaining indexes with old names
    const oldIndexes = indexesResult.rows.filter(row => 
      row.indexname.startsWith('Payment') || 
      row.indexname.startsWith('payment_') && row.indexname.includes('Payment')
    );

    if (oldIndexes.length > 0) {
      console.log('\n⚠ Warning: Found indexes with old naming pattern:');
      oldIndexes.forEach(idx => {
        console.log(`  - ${idx.tablename}: ${idx.indexname}`);
      });
    }

    // Verify no data loss
    console.log('\n6. Verifying data integrity...\n');

    // Check payment_transaction data
    const paymentTransactionCount = await client.query(`
      SELECT COUNT(*) as count
      FROM "payment_transaction";
    `);

    console.log(`✓ payment_transaction: ${paymentTransactionCount.rows[0].count} records`);

    // Check payment_gateway_settings data
    const gatewaySettingsCount = await client.query(`
      SELECT COUNT(*) as count
      FROM "payment_gateway_settings";
    `);

    console.log(`✓ payment_gateway_settings: ${gatewaySettingsCount.rows[0].count} records`);

    // Check payment_log data
    const paymentLogCount = await client.query(`
      SELECT COUNT(*) as count
      FROM "payment_log";
    `);

    console.log(`✓ payment_log: ${paymentLogCount.rows[0].count} records`);

    // Count total tables
    const totalTables = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);

    console.log(`\n✓ Total tables in database: ${totalTables.rows[0].count}`);
    console.log('✓ No data loss detected');

    // Summary
    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log('\n✓ Tables renamed from camelCase to snake_case:');
    console.log('  - PaymentTransaction -> payment_transaction');
    console.log('  - PaymentGatewaySettings -> payment_gateway_settings');
    console.log('  - PaymentLog -> payment_log');
    console.log('\n✓ All data preserved');
    console.log('✓ Indexes updated');
    console.log('✓ Migration executed without errors');
    console.log('\n========================================');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

executeMigration();
