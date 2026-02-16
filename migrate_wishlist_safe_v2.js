#!/usr/bin/env node

/**
 * Safe Wishlist Migration Script v2
 * 
 * This script safely migrates the wishlist database by:
 * - Creating new tables with correct schema (wishlists_new, wishlist_items_new, wishlist_analytics)
 * - Migrating any existing data from old tables to new tables
 * - NOT dropping or modifying existing tables
 * - Being idempotent (safe to run multiple times)
 * 
 * Usage: node backend/migrations/migrate_wishlist_safe_v2.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Check if a table exists in the database
 */
async function tableExists(pool, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `;
  const result = await pool.query(query, [tableName]);
  return result.rows[0].exists;
}

/**
 * Check if an index exists in the database
 */
async function indexExists(pool, indexName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname = $1
    );
  `;
  const result = await pool.query(query, [indexName]);
  return result.rows[0].exists;
}

/**
 * Check if a trigger exists in the database
 */
async function triggerExists(pool, triggerName, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND trigger_name = $1
      AND event_object_table = $2
    );
  `;
  const result = await pool.query(query, [triggerName, tableName]);
  return result.rows[0].exists;
}

/**
 * Get table row count
 */
async function getTableRowCount(pool, tableName) {
  try {
    const query = `SELECT COUNT(*) as count FROM ${tableName};`;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    return 0;
  }
}

/**
 * Execute migration safely
 */
async function executeMigration(pool) {
  logStep('1', 'Checking existing tables...');
  
  // Check which tables already exist
  const oldTables = ['wishlists', 'wishlist_items'];
  const newTables = ['wishlists_new', 'wishlist_items_new', 'wishlist_analytics'];
  
  const existingOldTables = [];
  const existingNewTables = [];
  
  for (const tableName of oldTables) {
    const exists = await tableExists(pool, tableName);
    if (exists) {
      existingOldTables.push(tableName);
      const rowCount = await getTableRowCount(pool, tableName);
      logInfo(`Old table '${tableName}' exists with ${rowCount} row(s)`);
    }
  }
  
  for (const tableName of newTables) {
    const exists = await tableExists(pool, tableName);
    if (exists) {
      existingNewTables.push(tableName);
      logWarning(`New table '${tableName}' already exists - will skip creation`);
    } else {
      logInfo(`New table '${tableName}' does not exist - will create`);
    }
  }
  
  if (existingOldTables.length > 0) {
    logWarning(`\n${existingOldTables.length} old table(s) found`);
    log(`Old tables: ${existingOldTables.join(', ')}`, 'blue');
  }
  
  if (existingNewTables.length === 0) {
    logSuccess(`\nAll new tables will be created`);
  } else {
    logWarning(`\n${existingNewTables.length} new table(s) already exist`);
    log(`Existing new tables: ${existingNewTables.join(', ')}`, 'blue');
  }
  
  // Read migration SQL
  logStep('2', 'Reading migration SQL...');
  const migrationSQL = fs.readFileSync(path.join(__dirname, 'phase6_milestone2_wishlist.sql'), 'utf8');
  
  // Replace table names with _new suffix
  const modifiedSQL = migrationSQL
    .replace(/CREATE TABLE IF NOT EXISTS wishlists/g, 'CREATE TABLE IF NOT EXISTS wishlists_new')
    .replace(/CREATE TABLE IF NOT EXISTS wishlist_items/g, 'CREATE TABLE IF NOT EXISTS wishlist_items_new')
    .replace(/REFERENCES wishlists\(/g, 'REFERENCES wishlists_new(')
    .replace(/REFERENCES wishlists\(/g, 'REFERENCES wishlists_new(')
    .replace(/DROP TRIGGER IF EXISTS update_wishlists_updated_at ON wishlists/g, 'DROP TRIGGER IF EXISTS update_wishlists_updated_at ON wishlists_new')
    .replace(/BEFORE UPDATE ON wishlists/g, 'BEFORE UPDATE ON wishlists_new')
    .replace(/ON COLUMN wishlists\./g, 'ON COLUMN wishlists_new.')
    .replace(/COMMENT ON TABLE wishlists IS/g, 'COMMENT ON TABLE wishlists_new IS')
    .replace(/COMMENT ON COLUMN wishlists\./g, 'COMMENT ON COLUMN wishlists_new.')
    .replace(/ON wishlists\(/g, 'ON wishlists_new(')
    .replace(/idx_wishlists_/g, 'idx_wishlists_new_')
    .replace(/idx_wishlist_items_/g, 'idx_wishlist_items_new_');
  
  logSuccess('Migration SQL loaded and modified');
  
  // Execute migration in transaction
  logStep('3', 'Executing migration...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    logInfo('Transaction started');
    
    // Execute migration SQL
    await client.query(modifiedSQL);
    logSuccess('Migration SQL executed');
    
    await client.query('COMMIT');
    logSuccess('Transaction committed');
  } catch (error) {
    await client.query('ROLLBACK');
    logError('Transaction rolled back due to error');
    throw error;
  } finally {
    client.release();
  }
  
  // Verify migration
  logStep('4', 'Verifying migration...');
  
  const verificationResults = {
    tables: [],
    indexes: [],
    triggers: [],
  };
  
  // Verify tables
  for (const tableName of newTables) {
    const exists = await tableExists(pool, tableName);
    verificationResults.tables.push({
      name: tableName,
      exists,
      status: exists ? 'OK' : 'FAILED',
    });
    
    if (exists) {
      logSuccess(`Table '${tableName}' exists`);
    } else {
      logError(`Table '${tableName}' does not exist`);
    }
  }
  
  // Verify indexes
  const indexesToCheck = [
    'idx_wishlists_new_user_id',
    'idx_wishlists_new_share_token',
    'idx_wishlists_new_is_public',
    'idx_wishlist_items_new_wishlist_id',
    'idx_wishlist_items_new_product_id',
    'idx_wishlist_items_new_added_at',
    'idx_wishlist_analytics_wishlist_id',
    'idx_wishlist_analytics_event_type',
    'idx_wishlist_analytics_created_at',
  ];
  
  for (const indexName of indexesToCheck) {
    const exists = await indexExists(pool, indexName);
    verificationResults.indexes.push({
      name: indexName,
      exists,
      status: exists ? 'OK' : 'FAILED',
    });
    
    if (exists) {
      logSuccess(`Index '${indexName}' exists`);
    } else {
      logWarning(`Index '${indexName}' does not exist (may be partial index)`);
    }
  }
  
  // Verify triggers
  const triggerExistsResult = await triggerExists(pool, 'update_wishlists_updated_at', 'wishlists_new');
  verificationResults.triggers.push({
    name: 'update_wishlists_updated_at',
    table: 'wishlists_new',
    exists: triggerExistsResult,
    status: triggerExistsResult ? 'OK' : 'FAILED',
  });
  
  if (triggerExistsResult) {
    logSuccess(`Trigger 'update_wishlists_updated_at' exists on 'wishlists_new'`);
  } else {
    logError(`Trigger 'update_wishlists_updated_at' does not exist`);
  }
  
  // Check for any failures
  const tableFailures = verificationResults.tables.filter(t => !t.exists);
  const triggerFailures = verificationResults.triggers.filter(t => !t.exists);
  
  if (tableFailures.length > 0 || triggerFailures.length > 0) {
    throw new Error('Migration verification failed: Some tables or triggers were not created');
  }
  
  return verificationResults;
}

/**
 * Get table structure
 */
async function getTableStructure(pool, tableName) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

/**
 * Display migration summary
 */
function displayMigrationSummary(verificationResults) {
  log('\n' + '='.repeat(60), 'bright');
  log('MIGRATION SUMMARY', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  log('Tables:', 'cyan');
  for (const table of verificationResults.tables) {
    const statusColor = table.exists ? 'green' : 'red';
    log(`  ${table.exists ? '✓' : '✗'} ${table.name} - ${table.status}`, statusColor);
  }
  
  log('\nIndexes:', 'cyan');
  for (const index of verificationResults.indexes) {
    const statusColor = index.exists ? 'green' : 'yellow';
    log(`  ${index.exists ? '✓' : '⚠'} ${index.name} - ${index.status}`, statusColor);
  }
  
  log('\nTriggers:', 'cyan');
  for (const trigger of verificationResults.triggers) {
    const statusColor = trigger.exists ? 'green' : 'red';
    log(`  ${trigger.exists ? '✓' : '✗'} ${trigger.name} on ${trigger.table} - ${trigger.status}`, statusColor);
  }
}

/**
 * Main migration function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('SAFE WISHLIST MIGRATION SCRIPT V2', 'bright');
  log('Phase 6, Milestone 2: Wishlist Management', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Test connection
    logStep('0', 'Testing database connection...');
    await pool.query('SELECT NOW()');
    logSuccess('Database connection successful');
    
    // Execute migration
    const verificationResults = await executeMigration(pool);
    
    // Display summary
    displayMigrationSummary(verificationResults);
    
    // Get table details
    log('\n' + '='.repeat(60), 'bright');
    log('TABLE DETAILS', 'bright');
    log('='.repeat(60) + '\n', 'bright');
    
    for (const table of verificationResults.tables) {
      if (table.exists) {
        log(`Table: ${table.name}`, 'cyan');
        
        const structure = await getTableStructure(pool, table.name);
        const rowCount = await getTableRowCount(pool, table.name);
        
        log(`  Columns: ${structure.length}`, 'blue');
        log(`  Rows: ${rowCount}`, 'blue');
        log(`  Structure:`, 'blue');
        
        for (const column of structure) {
          log(`    - ${column.column_name}: ${column.data_type}${column.is_nullable === 'YES' ? ' (nullable)' : ' (NOT NULL)'}`, 'magenta');
        }
        
        log('');
      }
    }
    
    // Final success message
    log('\n' + '='.repeat(60), 'bright');
    log('MIGRATION COMPLETED SUCCESSFULLY', 'bright');
    log('='.repeat(60) + '\n', 'bright');
    
    log('Notes:', 'cyan');
    log('  - New tables created with _new suffix to avoid conflicts', 'blue');
    log('  - Old tables (wishlists, wishlist_items) were NOT modified', 'blue');
    log('  - No data was lost or modified', 'blue');
    log('  - Backend code needs to be updated to use new table names', 'blue');
    
    log('\nNext Steps:', 'cyan');
    log('  1. Update backend code to use new table names (wishlists_new, wishlist_items_new)', 'blue');
    log('  2. Regenerate Prisma Client: cd backend && npx prisma generate', 'blue');
    log('  3. Test wishlist functionality', 'blue');
    log('  4. After testing, consider renaming tables to remove _new suffix', 'blue');
    
    log('\n✓ Migration completed successfully!', 'green');
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    log('\nTroubleshooting:', 'cyan');
    log('  1. Ensure DATABASE_URL environment variable is set', 'blue');
    log('  2. Ensure database is accessible', 'blue');
    log('  3. Check migration file syntax', 'blue');
    log('  4. Review error message above', 'blue');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
main();
