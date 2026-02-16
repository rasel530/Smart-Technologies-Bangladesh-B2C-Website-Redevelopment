/**
 * ============================================================================
 * CHECK USERS AND PRODUCTS TABLE ID TYPES
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

async function main() {
  logSection('CHECKING USERS AND PRODUCTS TABLE ID TYPES');
  
  // Check users table
  const usersResult = await prisma.$queryRaw`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id'
  `;
  
  log('\nusers.id:', 'yellow');
  if (usersResult.length > 0) {
    const col = usersResult[0];
    log(`  Type: ${col.data_type}`, 'cyan');
    log(`  Max Length: ${col.character_maximum_length || 'N/A'}`, 'cyan');
    log(`  Nullable: ${col.is_nullable}`, 'cyan');
  }
  
  // Check products table
  const productsResult = await prisma.$queryRaw`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'id'
  `;
  
  log('\nproducts.id:', 'yellow');
  if (productsResult.length > 0) {
    const col = productsResult[0];
    log(`  Type: ${col.data_type}`, 'cyan');
    log(`  Max Length: ${col.character_maximum_length || 'N/A'}`, 'cyan');
    log(`  Nullable: ${col.is_nullable}`, 'cyan');
  }
  
  // Check wishlists table
  const wishlistsResult = await prisma.$queryRaw`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'wishlists'
    AND column_name IN ('id', 'userId')
    ORDER BY column_name
  `;
  
  log('\nwishlists table:', 'yellow');
  for (const col of wishlistsResult) {
    log(`  ${col.column_name}: ${col.data_type}`, 'cyan');
  }
  
  // Check wishlist_items table
  const wishlistItemsResult = await prisma.$queryRaw`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'wishlist_items'
    AND column_name IN ('id', 'wishlistId', 'productId')
    ORDER BY column_name
  `;
  
  log('\nwishlist_items table:', 'yellow');
  for (const col of wishlistItemsResult) {
    log(`  ${col.column_name}: ${col.data_type}`, 'cyan');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
