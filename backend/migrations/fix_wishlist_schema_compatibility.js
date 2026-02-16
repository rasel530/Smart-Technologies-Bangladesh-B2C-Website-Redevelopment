/**
 * ============================================================================
 * FIX WISHLIST TABLE SCHEMA COMPATIBILITY WITH PRISMA
 * ============================================================================
 * Date: 2026-02-14
 * Purpose: Migrate existing wishlist tables to match Prisma schema
 * 
 * ISSUES FOUND:
 * 1. wishlists table:
 *    - id, userId: text instead of uuid
 *    - name: text instead of character varying
 *    - isPrivate: should be isDefault and isPublic
 *    - Missing: isDefault, isPublic, shareToken
 * 
 * 2. wishlist_items table:
 *    - id, wishlistId, productId: text instead of uuid
 * 
 * 3. wishlist_analytics table:
 *    - Column names use snake_case instead of camelCase
 *    - userId: text instead of uuid
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
    log(`Error executing SQL: ${error.message}`, 'red');
    log(`SQL: ${sql}`, 'cyan');
    return false;
  }
}

/**
 * Fix wishlists table schema
 */
async function fixWishlistsTable() {
  logSection('FIXING: wishlists TABLE');
  
  const operations = [
    // Step 1: Add new columns first
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false',
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false',
    'ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "shareToken" VARCHAR(255) UNIQUE',
    
    // Step 2: Drop foreign key constraint temporarily
    'ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey',
    
    // Step 3: Change column types from text to uuid
    'ALTER TABLE wishlists ALTER COLUMN "id" TYPE UUID USING "id"::uuid',
    'ALTER TABLE wishlists ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid',
    'ALTER TABLE wishlists ALTER COLUMN "name" TYPE VARCHAR(255)',
    
    // Step 4: Re-add foreign key constraint
    'ALTER TABLE wishlists ADD CONSTRAINT wishlists_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE',
    
    // Step 5: Drop the old isPrivate column (if exists)
    'ALTER TABLE wishlists DROP COLUMN IF EXISTS "isPrivate"',
    
    // Step 6: Add indexes
    'CREATE INDEX IF NOT EXISTS "wishlists_shareToken_idx" ON wishlists("shareToken")',
    'CREATE INDEX IF NOT EXISTS "wishlists_isPublic_idx" ON wishlists("isPublic")',
  ];
  
  let successCount = 0;
  for (const sql of operations) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ Success: ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ Failed: ${sql.substring(0, 60)}...`, 'red');
    }
  }
  
  log(`\nCompleted ${successCount}/${operations.length} operations`, 'cyan');
  return successCount === operations.length;
}

/**
 * Fix wishlist_items table schema
 */
async function fixWishlistItemsTable() {
  logSection('FIXING: wishlist_items TABLE');
  
  const operations = [
    // Step 1: Drop foreign key constraints temporarily
    'ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistId_fkey',
    'ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey',
    
    // Step 2: Change column types from text to uuid
    'ALTER TABLE wishlist_items ALTER COLUMN "id" TYPE UUID USING "id"::uuid',
    'ALTER TABLE wishlist_items ALTER COLUMN "wishlistId" TYPE UUID USING "wishlistId"::uuid',
    'ALTER TABLE wishlist_items ALTER COLUMN "productId" TYPE UUID USING "productId"::uuid',
    
    // Step 3: Re-add foreign key constraints
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlistId_fkey FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE',
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE',
    
    // Step 4: Add unique constraint
    'ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlistId_productId_key UNIQUE ("wishlistId", "productId")',
    
    // Step 5: Add index
    'CREATE INDEX IF NOT EXISTS "wishlist_items_addedAt_idx" ON wishlist_items("addedAt" DESC)',
  ];
  
  let successCount = 0;
  for (const sql of operations) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ Success: ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ Failed: ${sql.substring(0, 60)}...`, 'red');
    }
  }
  
  log(`\nCompleted ${successCount}/${operations.length} operations`, 'cyan');
  return successCount === operations.length;
}

/**
 * Fix wishlist_analytics table schema
 */
async function fixWishlistAnalyticsTable() {
  logSection('FIXING: wishlist_analytics TABLE');
  
  const operations = [
    // Step 1: Drop foreign key constraint temporarily
    'ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS wishlist_analytics_user_id_fkey',
    
    // Step 2: Rename columns from snake_case to camelCase
    'ALTER TABLE wishlist_analytics RENAME COLUMN "wishlist_id" TO "wishlistId"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "event_type" TO "eventType"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "user_id" TO "userId"',
    'ALTER TABLE wishlist_analytics RENAME COLUMN "created_at" TO "createdAt"',
    
    // Step 3: Change userId type from text to uuid
    'ALTER TABLE wishlist_analytics ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid',
    
    // Step 4: Re-add foreign key constraint
    'ALTER TABLE wishlist_analytics ADD CONSTRAINT wishlist_analytics_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL',
    
    // Step 5: Add foreign key to wishlists table
    'ALTER TABLE wishlist_analytics ADD CONSTRAINT wishlist_analytics_wishlistId_fkey FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE',
    
    // Step 6: Update indexes
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_wishlist_id"',
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_event_type"',
    'DROP INDEX IF EXISTS "idx_wishlist_analytics_created_at"',
    'CREATE INDEX IF NOT EXISTS "wishlist_analytics_eventType_idx" ON wishlist_analytics("eventType")',
    'CREATE INDEX IF NOT EXISTS "wishlist_analytics_createdAt_idx" ON wishlist_analytics("createdAt" DESC)',
  ];
  
  let successCount = 0;
  for (const sql of operations) {
    const success = await executeSQL(sql);
    if (success) {
      successCount++;
      log(`  ✓ Success: ${sql.substring(0, 60)}...`, 'green');
    } else {
      log(`  ✗ Failed: ${sql.substring(0, 60)}...`, 'red');
    }
  }
  
  log(`\nCompleted ${successCount}/${operations.length} operations`, 'cyan');
  return successCount === operations.length;
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  
  logSection('WISHLIST TABLE SCHEMA COMPATIBILITY FIX');
  log(`Execution started at: ${new Date().toISOString()}`, 'cyan');
  
  log('\nThis script will migrate the existing wishlist tables to match the Prisma schema.', 'yellow');
  log('Please ensure you have a database backup before proceeding.', 'yellow');
  
  // Execute fixes
  const results = {
    wishlists: await fixWishlistsTable(),
    wishlist_items: await fixWishlistItemsTable(),
    wishlist_analytics: await fixWishlistAnalyticsTable()
  };
  
  // Final summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('FIX SUMMARY');
  log(`Duration: ${duration} seconds`, 'cyan');
  
  log('\nResults:', 'bright');
  log(`  wishlists table: ${results.wishlists ? '✓ FIXED' : '✗ FAILED'}`, 
      results.wishlists ? 'green' : 'red');
  log(`  wishlist_items table: ${results.wishlist_items ? '✓ FIXED' : '✗ FAILED'}`, 
      results.wishlist_items ? 'green' : 'red');
  log(`  wishlist_analytics table: ${results.wishlist_analytics ? '✓ FIXED' : '✗ FAILED'}`, 
      results.wishlist_analytics ? 'green' : 'red');
  
  const allFixed = Object.values(results).every(r => r);
  
  log('\nOverall Status:', 'bright');
  if (allFixed) {
    log('  ✓ ALL TABLES SUCCESSFULLY MIGRATED', 'green');
    log('  ✓ Schema now matches Prisma requirements', 'green');
    log('  ✓ Field names match codebase requirements', 'green');
    log('\nNext steps:', 'yellow');
    log('  1. Run verification script to confirm changes', 'cyan');
    log('  2. Test wishlist functionality', 'cyan');
  } else {
    log('  ✗ SOME FIXES FAILED', 'red');
    log('  ✗ Manual intervention may be required', 'red');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return allFixed;
}

// Execute the script
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
