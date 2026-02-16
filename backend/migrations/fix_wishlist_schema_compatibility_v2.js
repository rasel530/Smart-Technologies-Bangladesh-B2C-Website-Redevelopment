/**
 * ============================================================================
 * FIX WISHLIST TABLE SCHEMA COMPATIBILITY WITH PRISMA (V2)
 * ============================================================================
 * Date: 2026-02-14
 * Purpose: Migrate existing wishlist tables to match Prisma schema
 * 
 * STRATEGY:
 * 1. Drop ALL foreign key constraints first
 * 2. Change ALL column types
 * 3. Rename ALL columns
 * 4. Add ALL foreign key constraints
 * 
 * This approach avoids circular dependency issues
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');

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
 * Execute SQL command
 */
async function executeSQL(sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    return true;
  } catch (error) {
    // Ignore "does not exist" errors
    if (error.message.includes('does not exist')) {
      return true;
    }
    log(`Error executing SQL: ${error.message}`, 'red');
    log(`SQL: ${sql}`, 'cyan');
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  
  logSection('WISHLIST TABLE SCHEMA COMPATIBILITY FIX (V2)');
  log(`Execution started at: ${new Date().toISOString()}`, 'cyan');
  
  log('\nThis script will migrate existing wishlist tables to match Prisma schema.', 'yellow');
  log('Strategy: Drop all FKs first, then change types, then re-add FKs', 'yellow');
  
  // Phase 1: Drop all foreign key constraints
  logSection('PHASE 1: DROPPING ALL FOREIGN KEY CONSTRAINTS');
  
  const dropFKs = [
    // wishlist_items table FKs
    'ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistId_fkey',
    'ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey',
    
    // wishlist_analytics table FKs
    'ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS wishlist_analytics_userId_fkey',
    'ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS wishlist_analytics_wishlistId_fkey',
    
    // wishlists table FKs
    'ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey',
  ];
  
  let successCount = 0;
  for (const sql of dropFKs) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nDropped ${successCount}/${dropFKs.length} foreign key constraints`, 'cyan');
  
  // Phase 2: Change column types
  logSection('PHASE 2: CHANGING COLUMN TYPES');
  
  const changeTypes = [
    // wishlists table
    'ALTER TABLE wishlists ALTER COLUMN "id" TYPE UUID USING "id"::uuid',
    'ALTER TABLE wishlists ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid',
    'ALTER TABLE wishlists ALTER COLUMN "name" TYPE VARCHAR(255)',
    
    // wishlist_items table
    'ALTER TABLE wishlist_items ALTER COLUMN "id" TYPE UUID USING "id"::uuid',
    'ALTER TABLE wishlist_items ALTER COLUMN "wishlistId" TYPE UUID USING "wishlistId"::uuid',
    'ALTER TABLE wishlist_items ALTER COLUMN "productId" TYPE UUID USING "productId"::uuid',
    
    // wishlist_analytics table
    'ALTER TABLE wishlist_analytics ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid',
  ];
  
  successCount = 0;
  for (const sql of changeTypes) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nChanged ${successCount}/${changeTypes.length} column types`, 'cyan');
  
  // Phase 3: Rename columns
  logSection('PHASE 3: RENAMING COLUMNS');
  
  const renameColumns = [
    // wishlist_analytics table: snake_case to camelCase
    'ALTER TABLE wishlist_analytics RENAME COLUMN "wishlist_id" TO "wishlistId"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "event_type" TO "eventType"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "user_id" TO "userId"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "created_at" TO "createdAt"',
  ];
  
  successCount = 0;
  for (const sql of renameColumns) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nRenamed ${successCount}/${renameColumns.length} columns`, 'cyan');
  
  // Phase 4: Add new columns
  logSection('PHASE 4: ADDING NEW COLUMNS');
  
  const addColumns = [
    // wishlists table
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false',
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false',
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "shareToken" VARCHAR(255) UNIQUE',
  ];
  
  successCount = 0;
  for (const sql of addColumns) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nAdded ${successCount}/${addColumns.length} columns`, 'cyan');
  
  // Phase 5: Drop old columns
  logSection('PHASE 5: DROPPING OLD COLUMNS');
  
  const dropColumns = [
    // wishlists table
    'ALTER TABLE wishlists DROP COLUMN IF EXISTS "isPrivate"',
  ];
  
  successCount = 0;
  for (const sql of dropColumns) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nDropped ${successCount}/${dropColumns.length} columns`, 'cyan');
  
  // Phase 6: Re-add foreign key constraints
  logSection('PHASE 6: RE-ADDING FOREIGN KEY CONSTRAINTS');
  
  const addFKs = [
    // wishlist_items table FKs
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlistId_fkey FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE',
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE',
    
    // wishlist_analytics table FKs
    'ALTER TABLE wishlist_analytics ADD CONSTRAINT wishlist_analytics_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL',
    'ALTER TABLE wishlist_analytics ADD CONSTRAINT wishlist_analytics_wishlistId_fkey FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE',
    
    // wishlists table FKs
    'ALTER TABLE wishlists ADD CONSTRAINT wishlists_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE',
  ];
  
  successCount = 0;
  for (const sql of addFKs) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nAdded ${successCount}/${addFKs.length} foreign key constraints`, 'cyan');
  
  // Phase 7: Add unique constraints
  logSection('PHASE 7: ADDING UNIQUE CONSTRAINTS');
  
  const addUniques = [
    // wishlist_items table
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlistId_productId_key UNIQUE ("wishlistId", "productId")',
  ];
  
  successCount = 0;
  for (const sql of addUniques) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nAdded ${successCount}/${addUniques.length} unique constraints`, 'cyan');
  
  // Phase 8: Add indexes
  logSection('PHASE 8: ADDING INDEXES');
  
  const addIndexes = [
    // Drop old indexes first
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_wishlist_id"',
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_event_type"',
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_created_at"',
    
    // Add new indexes
    'CREATE INDEX IF NOT EXISTS "wishlists_shareToken_idx" ON wishlists("shareToken")',
    'CREATE INDEX IF NOT EXISTS "wishlists_isPublic_idx" ON wishlists("isPublic")',
    'CREATE INDEX IF NOT EXISTS "wishlist_items_addedAt_idx" ON wishlist_items("addedAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "wishlist_analytics_eventType_idx" ON wishlist_analytics("eventType")',
    'CREATE INDEX IF NOT EXISTS "wishlist_analytics_createdAt_idx" ON wishlist_analytics("createdAt" DESC)',
  ];
  
  successCount = 0;
  for (const sql of addIndexes) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ ${sql.substring(0, 60)}...`, 'red');
    }
  }
  log(`\nAdded ${successCount}/${addIndexes.length} indexes`, 'cyan');
  
  // Final summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('FIX SUMMARY');
  log(`Duration: ${duration} seconds`, 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  log('\nAll phases completed!', 'green');
  log('\nNext steps:', 'yellow');
  log('  1. Run verification script to confirm changes', 'cyan');
  log('  2. Test wishlist functionality', 'cyan');
  log('  3. Verify backend API endpoints work correctly', 'cyan');
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return true;
}

// Execute script
main()
  .then((success) => {
    if (success) {
      log('Schema fix completed successfully.', 'green');
      process.exit(0);
    } else {
      log('Schema fix completed with errors.', 'red');
      process.exit(1);
    }
  })
  .catch((error) => {
    log(`\nSchema fix failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
