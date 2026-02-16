/**
 * ============================================================================
 * WISHLIST TABLE SCHEMA COMPATIBILITY VERIFICATION
 * ============================================================================
 * Date: 2026-02-14
 * Purpose: Verify that existing wishlist tables match the Prisma schema
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
 * Get table columns from database
 */
async function getTableColumns(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return result;
  } catch (error) {
    log(`Error getting columns for ${tableName}: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Get table constraints from database
 */
async function getTableConstraints(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
      ORDER BY tc.constraint_type, tc.constraint_name
    `;
    return result;
  } catch (error) {
    log(`Error getting constraints for ${tableName}: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Get table indexes from database
 */
async function getTableIndexes(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = ${tableName}
      ORDER BY indexname
    `;
    return result;
  } catch (error) {
    log(`Error getting indexes for ${tableName}: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Verify wishlists table schema
 */
async function verifyWishlistsTable() {
  logSection('VERIFYING: wishlists TABLE');
  
  const tableName = 'wishlists';
  const columns = await getTableColumns(tableName);
  const constraints = await getTableConstraints(tableName);
  const indexes = await getTableIndexes(tableName);
  
  // Expected columns based on Prisma schema
  const expectedColumns = [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'userId', type: 'uuid', nullable: false },
    { name: 'name', type: 'character varying', nullable: true },
    { name: 'isDefault', type: 'boolean', nullable: false },
    { name: 'isPublic', type: 'boolean', nullable: false },
    { name: 'shareToken', type: 'character varying', nullable: true },
    { name: 'createdAt', type: 'timestamp without time zone', nullable: false },
    { name: 'updatedAt', type: 'timestamp without time zone', nullable: false },
    { name: 'expiresAt', type: 'timestamp without time zone', nullable: true }
  ];
  
  log('\nExpected columns:', 'yellow');
  for (const col of expectedColumns) {
    log(`  - ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(NOT NULL)'}`, 'cyan');
  }
  
  log('\nActual columns:', 'yellow');
  for (const col of columns) {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    log(`  - ${col.column_name}: ${col.data_type} ${nullable}`, 'cyan');
  }
  
  // Verify columns
  log('\nColumn verification:', 'yellow');
  let allColumnsMatch = true;
  
  for (const expected of expectedColumns) {
    const actual = columns.find(c => c.column_name === expected.name);
    
    if (!actual) {
      log(`  ✗ Column ${expected.name} NOT FOUND`, 'red');
      allColumnsMatch = false;
    } else {
      const typeMatch = actual.data_type.includes(expected.type) || 
                       (expected.type === 'character varying' && actual.data_type === 'character varying');
      const nullableMatch = (expected.nullable && actual.is_nullable === 'YES') ||
                            (!expected.nullable && actual.is_nullable === 'NO');
      
      if (typeMatch && nullableMatch) {
        log(`  ✓ ${expected.name}: OK`, 'green');
      } else {
        log(`  ✗ ${expected.name}: Type or nullable mismatch`, 'red');
        log(`    Expected: ${expected.type}, nullable=${expected.nullable}`, 'cyan');
        log(`    Actual: ${actual.data_type}, nullable=${actual.is_nullable === 'YES'}`, 'cyan');
        allColumnsMatch = false;
      }
    }
  }
  
  // Verify constraints
  log('\nConstraints:', 'yellow');
  for (const constraint of constraints) {
    const detail = constraint.constraint_type === 'FOREIGN KEY' 
      ? ` -> ${constraint.foreign_table_name}(${constraint.foreign_column_name})`
      : '';
    log(`  - ${constraint.constraint_type}: ${constraint.constraint_name}${detail}`, 'cyan');
  }
  
  // Verify indexes
  log('\nIndexes:', 'yellow');
  for (const index of indexes) {
    log(`  - ${index.indexname}`, 'cyan');
  }
  
  return allColumnsMatch;
}

/**
 * Verify wishlist_items table schema
 */
async function verifyWishlistItemsTable() {
  logSection('VERIFYING: wishlist_items TABLE');
  
  const tableName = 'wishlist_items';
  const columns = await getTableColumns(tableName);
  const constraints = await getTableConstraints(tableName);
  const indexes = await getTableIndexes(tableName);
  
  // Expected columns based on Prisma schema
  const expectedColumns = [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'wishlistId', type: 'uuid', nullable: false },
    { name: 'productId', type: 'uuid', nullable: false },
    { name: 'addedAt', type: 'timestamp without time zone', nullable: false }
  ];
  
  log('\nExpected columns:', 'yellow');
  for (const col of expectedColumns) {
    log(`  - ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(NOT NULL)'}`, 'cyan');
  }
  
  log('\nActual columns:', 'yellow');
  for (const col of columns) {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    log(`  - ${col.column_name}: ${col.data_type} ${nullable}`, 'cyan');
  }
  
  // Verify columns
  log('\nColumn verification:', 'yellow');
  let allColumnsMatch = true;
  
  for (const expected of expectedColumns) {
    const actual = columns.find(c => c.column_name === expected.name);
    
    if (!actual) {
      log(`  ✗ Column ${expected.name} NOT FOUND`, 'red');
      allColumnsMatch = false;
    } else {
      const typeMatch = actual.data_type.includes(expected.type) || 
                       (expected.type === 'character varying' && actual.data_type === 'character varying');
      const nullableMatch = (expected.nullable && actual.is_nullable === 'YES') ||
                            (!expected.nullable && actual.is_nullable === 'NO');
      
      if (typeMatch && nullableMatch) {
        log(`  ✓ ${expected.name}: OK`, 'green');
      } else {
        log(`  ✗ ${expected.name}: Type or nullable mismatch`, 'red');
        log(`    Expected: ${expected.type}, nullable=${expected.nullable}`, 'cyan');
        log(`    Actual: ${actual.data_type}, nullable=${actual.is_nullable === 'YES'}`, 'cyan');
        allColumnsMatch = false;
      }
    }
  }
  
  // Verify constraints
  log('\nConstraints:', 'yellow');
  for (const constraint of constraints) {
    const detail = constraint.constraint_type === 'FOREIGN KEY' 
      ? ` -> ${constraint.foreign_table_name}(${constraint.foreign_column_name})`
      : '';
    log(`  - ${constraint.constraint_type}: ${constraint.constraint_name}${detail}`, 'cyan');
  }
  
  // Verify indexes
  log('\nIndexes:', 'yellow');
  for (const index of indexes) {
    log(`  - ${index.indexname}`, 'cyan');
  }
  
  return allColumnsMatch;
}

/**
 * Verify wishlist_analytics table schema
 */
async function verifyWishlistAnalyticsTable() {
  logSection('VERIFYING: wishlist_analytics TABLE');
  
  const tableName = 'wishlist_analytics';
  const columns = await getTableColumns(tableName);
  const constraints = await getTableConstraints(tableName);
  const indexes = await getTableIndexes(tableName);
  
  // Expected columns based on Prisma schema
  const expectedColumns = [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'wishlistId', type: 'uuid', nullable: false },
    { name: 'eventType', type: 'character varying', nullable: false },
    { name: 'userId', type: 'uuid', nullable: true },
    { name: 'metadata', type: 'json', nullable: true },
    { name: 'createdAt', type: 'timestamp without time zone', nullable: false }
  ];
  
  log('\nExpected columns:', 'yellow');
  for (const col of expectedColumns) {
    log(`  - ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(NOT NULL)'}`, 'cyan');
  }
  
  log('\nActual columns:', 'yellow');
  for (const col of columns) {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    log(`  - ${col.column_name}: ${col.data_type} ${nullable}`, 'cyan');
  }
  
  // Verify columns
  log('\nColumn verification:', 'yellow');
  let allColumnsMatch = true;
  
  for (const expected of expectedColumns) {
    const actual = columns.find(c => c.column_name === expected.name);
    
    if (!actual) {
      log(`  ✗ Column ${expected.name} NOT FOUND`, 'red');
      allColumnsMatch = false;
    } else {
      const typeMatch = actual.data_type.includes(expected.type) || 
                       (expected.type === 'character varying' && actual.data_type === 'character varying') ||
                       (expected.type === 'json' && actual.data_type === 'jsonb');
      const nullableMatch = (expected.nullable && actual.is_nullable === 'YES') ||
                            (!expected.nullable && actual.is_nullable === 'NO');
      
      if (typeMatch && nullableMatch) {
        log(`  ✓ ${expected.name}: OK`, 'green');
      } else {
        log(`  ✗ ${expected.name}: Type or nullable mismatch`, 'red');
        log(`    Expected: ${expected.type}, nullable=${expected.nullable}`, 'cyan');
        log(`    Actual: ${actual.data_type}, nullable=${actual.is_nullable === 'YES'}`, 'cyan');
        allColumnsMatch = false;
      }
    }
  }
  
  // Verify constraints
  log('\nConstraints:', 'yellow');
  for (const constraint of constraints) {
    const detail = constraint.constraint_type === 'FOREIGN KEY' 
      ? ` -> ${constraint.foreign_table_name}(${constraint.foreign_column_name})`
      : '';
    log(`  - ${constraint.constraint_type}: ${constraint.constraint_name}${detail}`, 'cyan');
  }
  
  // Verify indexes
  log('\nIndexes:', 'yellow');
  for (const index of indexes) {
    log(`  - ${index.indexname}`, 'cyan');
  }
  
  return allColumnsMatch;
}

/**
 * Main verification function
 */
async function main() {
  logSection('WISHLIST TABLE SCHEMA COMPATIBILITY VERIFICATION');
  log(`Verification timestamp: ${new Date().toISOString()}`, 'cyan');
  
  const results = {
    wishlists: await verifyWishlistsTable(),
    wishlist_items: await verifyWishlistItemsTable(),
    wishlist_analytics: await verifyWishlistAnalyticsTable()
  };
  
  // Final summary
  logSection('VERIFICATION SUMMARY');
  
  log('\nResults:', 'bright');
  log(`  wishlists table: ${results.wishlists ? '✓ COMPATIBLE' : '✗ INCOMPATIBLE'}`, 
      results.wishlists ? 'green' : 'red');
  log(`  wishlist_items table: ${results.wishlist_items ? '✓ COMPATIBLE' : '✗ INCOMPATIBLE'}`, 
      results.wishlist_items ? 'green' : 'red');
  log(`  wishlist_analytics table: ${results.wishlist_analytics ? '✓ COMPATIBLE' : '✗ INCOMPATIBLE'}`, 
      results.wishlist_analytics ? 'green' : 'red');
  
  const allCompatible = Object.values(results).every(r => r);
  
  log('\nOverall Status:', 'bright');
  if (allCompatible) {
    log('  ✓ ALL TABLES COMPATIBLE WITH PRISMA SCHEMA', 'green');
    log('  ✓ Field names match the codebase requirements', 'green');
    log('  ✓ No schema migration needed', 'green');
  } else {
    log('  ✗ SOME TABLES ARE INCOMPATIBLE', 'red');
    log('  ✗ Schema migration may be required', 'red');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return allCompatible;
}

// Execute the verification
main()
  .then((success) => {
    if (success) {
      log('Schema verification completed successfully.', 'green');
      process.exit(0);
    } else {
      log('Schema verification failed.', 'red');
      process.exit(1);
    }
  })
  .catch((error) => {
    log(`\nSchema verification failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
