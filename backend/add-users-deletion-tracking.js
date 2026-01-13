/**
 * Add Deletion Tracking Columns to Users Table
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function addDeletionTracking() {
  let client;
  try {
    client = await pool.connect();
    console.log('='.repeat(70));
    console.log('ADDING DELETION TRACKING COLUMNS TO USERS TABLE');
    console.log('='.repeat(70));

    // Check current users table columns
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('\nExisting columns in users table:');
    existingColumns.forEach(col => console.log(`  - ${col}`));

    // Add missing columns
    const columnsToAdd = {
      accountStatus: 'TEXT DEFAULT \'active\'',
      deletionRequestedAt: 'TIMESTAMP',
      deletedAt: 'TIMESTAMP',
      deletionReason: 'TEXT'
    };

    console.log('\nAdding missing columns...');
    for (const [columnName, columnDef] of Object.entries(columnsToAdd)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`  Adding ${columnName}...`);
        await client.query(`ALTER TABLE users ADD COLUMN "${columnName}" ${columnDef}`);
        console.log(`  ✅ ${columnName} added`);
      } else {
        console.log(`  ℹ️  ${columnName} already exists`);
      }
    }

    // Add constraint if not exists
    const constraintResult = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND conname = 'valid_account_status';
    `);

    if (constraintResult.rows.length === 0) {
      console.log('\nAdding valid_account_status constraint...');
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT valid_account_status
        CHECK ("accountStatus" IN ('active', 'pending_deletion', 'deleted'))
      `);
      console.log('  ✅ Constraint added');
    } else {
      console.log('\nℹ️  valid_account_status constraint already exists');
    }

    // Verify changes
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION');
    console.log('='.repeat(70));

    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('accountStatus', 'deletionRequestedAt', 'deletedAt', 'deletionReason')
      ORDER BY ordinal_position;
    `);

    console.log('\nDeletion tracking columns in users table:');
    for (const row of finalColumns.rows) {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
      console.log(`  ✅ ${row.column_name}: ${row.data_type} ${nullable} ${defaultVal}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ DELETION TRACKING COLUMNS ADDED SUCCESSFULLY');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Failed to add deletion tracking columns!');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    throw error;
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }
}

addDeletionTracking()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
