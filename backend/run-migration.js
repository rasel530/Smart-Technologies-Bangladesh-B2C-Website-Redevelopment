/**
 * Migration Runner Script
 * This script runs SQL migrations using Node.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration(migrationFile) {
  let client;
  try {
    client = await pool.connect();
    console.log('='.repeat(70));
    console.log('RUNNING MIGRATION');
    console.log('='.repeat(70));
    console.log(`Migration file: ${migrationFile}`);
    console.log(`Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70) + '\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded: ${migrationPath}`);
    console.log(`Size: ${migrationSQL.length} bytes\n`);

    // Execute migration
    console.log('Executing migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    console.log('='.repeat(70));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
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

// Run migration
const migrationFile = process.argv[2] || 'add_account_preferences_features.sql';
runMigration(migrationFile)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
