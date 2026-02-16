/**
 * ============================================================================
 * VERIFICATION OF WISHLIST TABLE REMOVAL
 * ============================================================================
 * Date: 2026-02-14
 * Purpose: Verify that redundant tables were removed and active tables are preserved
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
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
    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return parseInt(result[0].count);
  } catch (error) {
    log(`Error counting rows in ${tableName}: ${error.message}`, 'red');
    return -1;
  }
}

/**
 * Main verification function
 */
async function main() {
  logSection('VERIFICATION OF WISHLIST TABLE REMOVAL');
  log(`Verification timestamp: ${new Date().toISOString()}`, 'cyan');
  
  // Tables that should have been removed
  const removedTables = [
    { name: 'wishlists_new', expectedStatus: false },
    { name: 'wishlist_items_new', expectedStatus: false }
  ];
  
  // Tables that should still exist
  const activeTables = [
    { name: 'wishlists', expectedStatus: true },
    { name: 'wishlist_items', expectedStatus: true },
    { name: 'wishlist_analytics', expectedStatus: true }
  ];
  
  let allRemovedCorrectly = true;
  let allActivePreserved = true;
  
  // Verify removed tables
  logSection('VERIFICATION: REMOVED TABLES');
  log('\nThese tables should NOT exist:', 'yellow');
  
  for (const table of removedTables) {
    const exists = await tableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    const status = exists ? 'STILL EXISTS ❌' : 'REMOVED ✓';
    const statusColor = exists ? 'red' : 'green';
    
    log(`  ${table.name}: ${status}`, statusColor);
    if (exists) {
      log(`    Row count: ${rowCount}`, 'cyan');
      allRemovedCorrectly = false;
    }
  }
  
  // Verify active tables
  logSection('VERIFICATION: ACTIVE TABLES');
  log('\nThese tables SHOULD exist:', 'yellow');
  
  for (const table of activeTables) {
    const exists = await tableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    const status = exists ? 'EXISTS ✓' : 'MISSING ❌';
    const statusColor = exists ? 'green' : 'red';
    
    log(`  ${table.name}: ${status}`, statusColor);
    if (exists) {
      log(`    Row count: ${rowCount}`, 'cyan');
    } else {
      allActivePreserved = false;
    }
  }
  
  // Final summary
  logSection('VERIFICATION SUMMARY');
  
  log('\nResults:', 'bright');
  
  if (allRemovedCorrectly) {
    log('  ✓ All redundant tables successfully removed', 'green');
  } else {
    log('  ✗ Some redundant tables were not removed', 'red');
  }
  
  if (allActivePreserved) {
    log('  ✓ All active tables preserved intact', 'green');
  } else {
    log('  ✗ Some active tables are missing', 'red');
  }
  
  const overallSuccess = allRemovedCorrectly && allActivePreserved;
  
  log('\nOverall Status:', 'bright');
  if (overallSuccess) {
    log('  ✓ VERIFICATION PASSED - All operations successful', 'green');
  } else {
    log('  ✗ VERIFICATION FAILED - Some operations failed', 'red');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return overallSuccess;
}

// Execute the verification
main()
  .then((success) => {
    if (success) {
      log('Verification completed successfully.', 'green');
      process.exit(0);
    } else {
      log('Verification failed.', 'red');
      process.exit(1);
    }
  })
  .catch((error) => {
    log(`\nVerification failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
