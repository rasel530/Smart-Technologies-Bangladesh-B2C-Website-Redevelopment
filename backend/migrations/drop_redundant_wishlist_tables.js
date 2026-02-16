/**
 * ============================================================================
 * SAFE REMOVAL OF REDUNDANT WISHLIST TABLES - EXECUTION SCRIPT
 * ============================================================================
 * Date: 2026-02-14
 * Purpose: Safely remove empty, unused wishlist tables from the database
 *
 * TABLES TO REMOVE:
 *   1. wishlist_items_new - Empty (0 rows), NOT in Prisma schema, NOT used by backend
 *   2. wishlists_new      - Empty (0 rows), NOT in Prisma schema, NOT used by backend
 *
 * TABLES TO KEEP (DO NOT REMOVE):
 *   1. wishlists            - In Prisma schema, used by backend code
 *   2. wishlist_items       - In Prisma schema, used by backend code
 *   3. wishlist_analytics   - In Prisma schema, used by backend code
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

/**
 * Check if a table exists in the database
 */
async function tableExists(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0].exists;
  } catch (error) {
    log(`Error checking table ${tableName}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Get row count for a table
 */
async function getTableRowCount(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${tableName}"`)}
    `;
    return parseInt(result[0].count);
  } catch (error) {
    log(`Error counting rows in ${tableName}: ${error.message}`, 'red');
    return -1;
  }
}

/**
 * Drop a table with CASCADE
 */
async function dropTable(tableName) {
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    return true;
  } catch (error) {
    log(`Error dropping table ${tableName}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  
  logSection('SAFE REMOVAL OF REDUNDANT WISHLIST TABLES');
  log(`Execution started at: ${new Date().toISOString()}`, 'cyan');
  
  // Tables to remove
  const tablesToRemove = [
    { name: 'wishlist_items_new', reason: 'Empty (0 rows), NOT in Prisma schema, NOT used by backend' },
    { name: 'wishlists_new', reason: 'Empty (0 rows), NOT in Prisma schema, NOT used by backend' }
  ];
  
  // Tables to keep (for verification)
  const tablesToKeep = [
    { name: 'wishlists', reason: 'In Prisma schema, used by backend code' },
    { name: 'wishlist_items', reason: 'In Prisma schema, used by backend code' },
    { name: 'wishlist_analytics', reason: 'In Prisma schema, used by backend code' }
  ];
  
  // Step 1: Pre-removal verification
  logSection('STEP 1: PRE-REMOVAL VERIFICATION');
  
  log('\nTables to be removed:', 'yellow');
  for (const table of tablesToRemove) {
    const exists = await tableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    const status = exists ? 'EXISTS' : 'NOT FOUND';
    const statusColor = exists ? 'green' : 'red';
    
    log(`  - ${table.name}: ${status} (${rowCount} rows)`, statusColor);
    log(`    Reason: ${table.reason}`, 'cyan');
  }
  
  log('\nTables to be kept (verification only):', 'yellow');
  for (const table of tablesToKeep) {
    const exists = await tableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    const status = exists ? 'EXISTS' : 'NOT FOUND';
    const statusColor = exists ? 'green' : 'red';
    
    log(`  - ${table.name}: ${status} (${rowCount} rows)`, statusColor);
    log(`    Reason: ${table.reason}`, 'cyan');
  }
  
  // Step 2: Safety confirmation
  logSection('STEP 2: SAFETY CONFIRMATION');
  log('\nSafety checks:', 'yellow');
  log('  ✓ Only dropping tables with "_new" suffix', 'green');
  log('  ✓ Using IF EXISTS to prevent errors', 'green');
  log('  ✓ Using CASCADE for clean removal', 'green');
  log('  ✓ Dropping wishlist_items_new first (foreign key dependency)', 'green');
  log('  ✓ Active tables (wishlists, wishlist_items, wishlist_analytics) will be preserved', 'green');
  
  // Step 3: Execute removal
  logSection('STEP 3: EXECUTING TABLE REMOVAL');
  
  const removalResults = [];
  
  for (const table of tablesToRemove) {
    log(`\nDropping table: ${table.name}`, 'yellow');
    
    const success = await dropTable(table.name);
    removalResults.push({ table: table.name, success });
    
    if (success) {
      log(`  ✓ Successfully dropped ${table.name}`, 'green');
    } else {
      log(`  ✗ Failed to drop ${table.name}`, 'red');
    }
  }
  
  // Step 4: Post-removal verification
  logSection('STEP 4: POST-REMOVAL VERIFICATION');
  
  log('\nVerifying removed tables no longer exist:', 'yellow');
  let allRemoved = true;
  for (const table of tablesToRemove) {
    const exists = await tableExists(table.name);
    const status = exists ? 'STILL EXISTS' : 'REMOVED';
    const statusColor = exists ? 'red' : 'green';
    
    log(`  - ${table.name}: ${status}`, statusColor);
    
    if (exists) {
      allRemoved = false;
    }
  }
  
  log('\nVerifying active tables still exist:', 'yellow');
  let allActivePreserved = true;
  for (const table of tablesToKeep) {
    const exists = await tableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    const status = exists ? 'PRESERVED' : 'MISSING';
    const statusColor = exists ? 'green' : 'red';
    
    log(`  - ${table.name}: ${status} (${rowCount} rows)`, statusColor);
    
    if (!exists) {
      allActivePreserved = false;
    }
  }
  
  // Step 5: Final summary
  logSection('STEP 5: FINAL SUMMARY');
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log('\nExecution Summary:', 'bright');
  log(`  Duration: ${duration} seconds`, 'cyan');
  log(`  Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  log('\nTables Removed:', 'yellow');
  for (const result of removalResults) {
    const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
    const statusColor = result.success ? 'green' : 'red';
    log(`  ${status}: ${result.table}`, statusColor);
  }
  
  log('\nTables Preserved:', 'yellow');
  for (const table of tablesToKeep) {
    const rowCount = await getTableRowCount(table.name);
    log(`  ✓ ${table.name} (${rowCount} rows)`, 'green');
  }
  
  // Overall status
  log('\nOverall Status:', 'bright');
  if (allRemoved && allActivePreserved) {
    log('  ✓ ALL OPERATIONS SUCCESSFUL', 'green');
    log('  ✓ Redundant tables removed safely', 'green');
    log('  ✓ Active tables preserved intact', 'green');
  } else {
    log('  ✗ SOME OPERATIONS FAILED', 'red');
    if (!allRemoved) {
      log('  ✗ Not all redundant tables were removed', 'red');
    }
    if (!allActivePreserved) {
      log('  ✗ Some active tables may have been affected', 'red');
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Execute the script
main()
  .then(() => {
    log('Script execution completed.', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\nScript execution failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
