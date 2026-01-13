/**
 * Diagnostic Script to Check Existing Account Preferences Tables
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function diagnoseTables() {
  let client;
  try {
    client = await pool.connect();
    console.log('='.repeat(70));
    console.log('EXISTING TABLES DIAGNOSTIC');
    console.log('='.repeat(70));

    const tables = [
      'user_notification_preferences',
      'user_communication_preferences',
      'user_privacy_settings',
      'account_deletion_requests',
      'user_data_exports'
    ];

    for (const tableName of tables) {
      console.log(`\nTable: ${tableName}`);
      console.log('-'.repeat(70));

      // Check if table exists
      const existsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${tableName}'
        );
      `);

      if (!existsResult.rows[0].exists) {
        console.log('  ❌ Table does not exist');
        continue;
      }

      console.log('  ✅ Table exists');

      // Get column information
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      console.log('\n  Columns:');
      for (const row of columnsResult.rows) {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
        console.log(`    - ${row.column_name}: ${row.data_type} ${nullable} ${defaultVal}`);
      }

      // Get constraints
      const constraintsResult = await client.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = '${tableName}'::regclass
        ORDER BY conname;
      `);

      if (constraintsResult.rows.length > 0) {
        console.log('\n  Constraints:');
        const typeMap = { 'c': 'CHECK', 'u': 'UNIQUE', 'f': 'FOREIGN KEY', 'p': 'PRIMARY KEY' };
        for (const row of constraintsResult.rows) {
          console.log(`    - ${row.conname} (${typeMap[row.contype]})`);
        }
      }

      // Get indexes
      const indexesResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = '${tableName}'
        ORDER BY indexname;
      `);

      if (indexesResult.rows.length > 0) {
        console.log('\n  Indexes:');
        for (const row of indexesResult.rows) {
          console.log(`    - ${row.indexname}`);
        }
      }

      // Get triggers
      const triggersResult = await client.query(`
        SELECT trigger_name, event_manipulation, action_timing
        FROM information_schema.triggers
        WHERE event_object_table = '${tableName}'
        ORDER BY trigger_name;
      `);

      if (triggersResult.rows.length > 0) {
        console.log('\n  Triggers:');
        for (const row of triggersResult.rows) {
          console.log(`    - ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
        }
      }
    }

    // Check users table for deletion tracking columns
    console.log('\n' + '='.repeat(70));
    console.log('Table: users (deletion tracking columns)');
    console.log('-'.repeat(70));

    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('account_status', 'deletion_requested_at', 'deleted_at', 'deletion_reason')
      ORDER BY ordinal_position;
    `);

    if (usersColumns.rows.length > 0) {
      console.log('\n  Deletion tracking columns:');
      for (const row of usersColumns.rows) {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
        console.log(`    - ${row.column_name}: ${row.data_type} ${nullable} ${defaultVal}`);
      }
    } else {
      console.log('\n  ⚠️  No deletion tracking columns found');
    }

    // Check if users table has account_status constraint
    const constraintResult = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND conname = 'valid_account_status';
    `);

    if (constraintResult.rows.length > 0) {
      console.log('\n  ✅ valid_account_status constraint exists');
    } else {
      console.log('\n  ⚠️  valid_account_status constraint not found');
    }

  } catch (error) {
    console.error('\n❌ Diagnostic failed!');
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

diagnoseTables().catch(console.error);
