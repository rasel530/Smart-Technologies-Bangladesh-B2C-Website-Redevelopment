/**
 * Script to verify that the PostgreSQL enum types were created successfully
 */

require('dotenv').config();
const { Pool } = require('pg');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyEnumFix() {
  let pool = null;
  
  try {
    log('='.repeat(60), 'cyan');
    log('PostgreSQL Enum Type Verification', 'cyan');
    log('='.repeat(60), 'cyan');
    log('');

    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const dbConfig = {
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
      user: match[1],
      password: match[2]
    };

    // Create connection pool
    log('Connecting to PostgreSQL database...', 'yellow');
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    log('✓ Connected to database successfully', 'green');
    log('');

    // Check if SyncStatus enum exists
    log('Checking SyncStatus enum type...', 'yellow');
    const syncStatusResult = await client.query(`
      SELECT typname, enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SyncStatus'
      ORDER BY enumsortorder
    `);
    
    if (syncStatusResult.rows.length > 0) {
      log('✓ SyncStatus enum type exists', 'green');
      log('  Values:', 'blue');
      syncStatusResult.rows.forEach(row => {
        log(`    - ${row.enumlabel}`, 'blue');
      });
    } else {
      log('✗ SyncStatus enum type does NOT exist', 'red');
    }
    log('');

    // Check if MoveType enum exists
    log('Checking MoveType enum type...', 'yellow');
    const moveTypeResult = await client.query(`
      SELECT typname, enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'MoveType'
      ORDER BY enumsortorder
    `);
    
    if (moveTypeResult.rows.length > 0) {
      log('✓ MoveType enum type exists', 'green');
      log('  Values:', 'blue');
      moveTypeResult.rows.forEach(row => {
        log(`    - ${row.enumlabel}`, 'blue');
      });
    } else {
      log('✗ MoveType enum type does NOT exist', 'red');
    }
    log('');

    // Check cart_wishlist_sync table schema
    log('Checking cart_wishlist_sync table schema...', 'yellow');
    const syncTableResult = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'cart_wishlist_sync'
      AND column_name = 'sync_status'
    `);
    
    if (syncTableResult.rows.length > 0) {
      const column = syncTableResult.rows[0];
      log('✓ cart_wishlist_sync.sync_status column found', 'green');
      log(`  Data Type: ${column.data_type}`, 'blue');
      log(`  UDT Name: ${column.udt_name}`, 'blue');
      
      if (column.udt_name === 'SyncStatus') {
        log('  ✓ Column is using SyncStatus enum type', 'green');
      } else {
        log('  ✗ Column is NOT using SyncStatus enum type', 'red');
      }
    } else {
      log('✗ cart_wishlist_sync.sync_status column not found', 'red');
    }
    log('');

    // Check cart_wishlist_move_history table schema
    log('Checking cart_wishlist_move_history table schema...', 'yellow');
    const moveHistoryResult = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'cart_wishlist_move_history'
      AND column_name = 'move_type'
    `);
    
    if (moveHistoryResult.rows.length > 0) {
      const column = moveHistoryResult.rows[0];
      log('✓ cart_wishlist_move_history.move_type column found', 'green');
      log(`  Data Type: ${column.data_type}`, 'blue');
      log(`  UDT Name: ${column.udt_name}`, 'blue');
      
      if (column.udt_name === 'MoveType') {
        log('  ✓ Column is using MoveType enum type', 'green');
      } else {
        log('  ✗ Column is NOT using MoveType enum type', 'red');
      }
    } else {
      log('✗ cart_wishlist_move_history.move_type column not found', 'red');
    }
    log('');

    // Final summary
    const syncStatusExists = syncStatusResult.rows.length > 0;
    const moveTypeExists = moveTypeResult.rows.length > 0;
    const syncColumnCorrect = syncTableResult.rows.length > 0 && syncTableResult.rows[0].udt_name === 'SyncStatus';
    const moveColumnCorrect = moveHistoryResult.rows.length > 0 && moveHistoryResult.rows[0].udt_name === 'MoveType';
    
    log('='.repeat(60), 'cyan');
    if (syncStatusExists && moveTypeExists && syncColumnCorrect && moveColumnCorrect) {
      log('✓ All checks passed! Enum types are correctly configured.', 'green');
    } else {
      log('✗ Some checks failed. Please review the output above.', 'red');
    }
    log('='.repeat(60), 'cyan');
    log('');

    // Release client
    client.release();

  } catch (error) {
    log('', 'red');
    log('='.repeat(60), 'red');
    log('Verification failed!', 'red');
    log('='.repeat(60), 'red');
    log('');
    log('Error Details:', 'red');
    log(`  Message: ${error.message}`, 'red');
    log('');
    console.error(error);
    log('');
    process.exit(1);
    
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.end();
      log('Database connection closed', 'yellow');
    }
  }
}

// Execute the verification
verifyEnumFix();
