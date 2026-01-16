/**
 * Fix Schema Drift - Add Missing Enum Columns
 * 
 * This script fixes the schema drift issue by adding all missing enum columns
 * to the database tables that were defined in the initial migration but
 * somehow got removed.
 * 
 * This is the definitive fix for the database migration issues.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixSchemaDrift() {
  console.log('=== FIXING SCHEMA DRIFT - ADDING MISSING ENUM COLUMNS ===\n');

  try {
    // Step 1: Backup existing data
    console.log('Step 1: Backing up existing data...\n');
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-before-schema-fix-${timestamp}.json`);
    
    // Backup users
    const users = await prisma.$queryRaw`SELECT * FROM users`;
    // Backup addresses
    const addresses = await prisma.$queryRaw`SELECT * FROM addresses`;
    // Backup products
    const products = await prisma.$queryRaw`SELECT * FROM products`;
    // Backup orders
    const orders = await prisma.$queryRaw`SELECT * FROM orders`;
    // Backup transactions
    const transactions = await prisma.$queryRaw`SELECT * FROM transactions`;
    // Backup user_social_accounts
    const socialAccounts = await prisma.$queryRaw`SELECT * FROM user_social_accounts`;
    // Backup coupons
    const coupons = await prisma.$queryRaw`SELECT * FROM coupons`;
    // Backup user_privacy_settings
    const privacySettings = await prisma.$queryRaw`SELECT * FROM user_privacy_settings`;
    
    const backupData = {
      users,
      addresses,
      products,
      orders,
      transactions,
      socialAccounts,
      coupons,
      privacySettings,
      backupDate: new Date().toISOString()
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`  ✓ Data backed up to: ${backupFile}\n`);
    
    // Step 2: Add missing enum columns to users table
    console.log('Step 2: Adding missing enum columns to users table...\n');
    
    // Check if role column exists
    const roleColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      )
    `;
    
    if (!roleColumnExists[0].exists) {
      console.log('  Adding role column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN role "UserRole" NOT NULL DEFAULT 'customer'`);
      console.log('  ✓ Added role column');
    } else {
      console.log('  ✓ role column already exists');
    }
    
    // Check if status column exists
    const statusColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
      )
    `;
    
    if (!statusColumnExists[0].exists) {
      console.log('  Adding status column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN status "UserStatus" NOT NULL DEFAULT 'active'`);
      console.log('  ✓ Added status column');
    } else {
      console.log('  ✓ status column already exists');
    }
    
    console.log();
    
    // Step 3: Add missing enum column to addresses table
    console.log('Step 3: Adding missing enum columns to addresses table...\n');
    
    const addressTypeColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' AND column_name = 'type'
      )
    `;
    
    if (!addressTypeColumnExists[0].exists) {
      console.log('  Adding type column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE addresses ADD COLUMN type "AddressType" NOT NULL DEFAULT 'shipping'`);
      console.log('  ✓ Added type column');
    } else {
      console.log('  ✓ type column already exists');
    }
    
    const addressDivisionColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' AND column_name = 'division'
      )
    `;
    
    if (!addressDivisionColumnExists[0].exists) {
      console.log('  Adding division column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE addresses ADD COLUMN division "Division" NOT NULL DEFAULT 'dhaka'`);
      console.log('  ✓ Added division column');
    } else {
      console.log('  ✓ division column already exists');
    }
    
    console.log();
    
    // Step 4: Add missing enum column to products table
    console.log('Step 4: Adding missing enum columns to products table...\n');
    
    const productStatusColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
      )
    `;
    
    if (!productStatusColumnExists[0].exists) {
      console.log('  Adding status column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN status "ProductStatus" NOT NULL DEFAULT 'active'`);
      console.log('  ✓ Added status column');
    } else {
      console.log('  ✓ status column already exists');
    }
    
    console.log();
    
    // Step 5: Add missing enum columns to orders table
    console.log('Step 5: Adding missing enum columns to orders table...\n');
    
    const orderStatusColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'status'
      )
    `;
    
    if (!orderStatusColumnExists[0].exists) {
      console.log('  Adding status column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN status "OrderStatus" NOT NULL DEFAULT 'pending'`);
      console.log('  ✓ Added status column');
    } else {
      console.log('  ✓ status column already exists');
    }
    
    const orderPaymentMethodColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'paymentMethod'
      )
    `;
    
    if (!orderPaymentMethodColumnExists[0].exists) {
      console.log('  Adding paymentMethod column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cash_on_delivery'`);
      console.log('  ✓ Added paymentMethod column');
    } else {
      console.log('  ✓ paymentMethod column already exists');
    }
    
    const orderPaymentStatusColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'paymentStatus'
      )
    `;
    
    if (!orderPaymentStatusColumnExists[0].exists) {
      console.log('  Adding paymentStatus column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending'`);
      console.log('  ✓ Added paymentStatus column');
    } else {
      console.log('  ✓ paymentStatus column already exists');
    }
    
    console.log();
    
    // Step 6: Add missing enum column to transactions table
    console.log('Step 6: Adding missing enum columns to transactions table...\n');
    
    const transactionStatusColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'status'
      )
    `;
    
    if (!transactionStatusColumnExists[0].exists) {
      console.log('  Adding status column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN status "PaymentStatus" NOT NULL DEFAULT 'pending'`);
      console.log('  ✓ Added status column');
    } else {
      console.log('  ✓ status column already exists');
    }
    
    console.log();
    
    // Step 7: Add missing enum column to user_social_accounts table
    console.log('Step 7: Adding missing enum columns to user_social_accounts table...\n');
    
    const socialProviderColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_social_accounts' AND column_name = 'provider'
      )
    `;
    
    if (!socialProviderColumnExists[0].exists) {
      console.log('  Adding provider column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE user_social_accounts ADD COLUMN provider "SocialProvider" NOT NULL DEFAULT 'google'`);
      console.log('  ✓ Added provider column');
    } else {
      console.log('  ✓ provider column already exists');
    }
    
    console.log();
    
    // Step 8: Add missing enum column to coupons table
    console.log('Step 8: Adding missing enum columns to coupons table...\n');
    
    const couponTypeColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'type'
      )
    `;
    
    if (!couponTypeColumnExists[0].exists) {
      console.log('  Adding type column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE coupons ADD COLUMN type "CouponType" NOT NULL DEFAULT 'percentage'`);
      console.log('  ✓ Added type column');
    } else {
      console.log('  ✓ type column already exists');
    }
    
    console.log();
    
    // Step 9: Add missing enum column to user_privacy_settings table
    console.log('Step 9: Adding missing enum columns to user_privacy_settings table...\n');
    
    const profileVisibilityColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_privacy_settings' AND column_name = 'profileVisibility'
      )
    `;
    
    if (!profileVisibilityColumnExists[0].exists) {
      console.log('  Adding profileVisibility column...');
      await prisma.$executeRawUnsafe(`ALTER TABLE user_privacy_settings ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'public'`);
      console.log('  ✓ Added profileVisibility column');
    } else {
      console.log('  ✓ profileVisibility column already exists');
    }
    
    console.log();
    
    // Step 10: Update role_hierarchy table to remove enum columns (they don't exist in schema)
    console.log('Step 10: Fixing role_hierarchy table...\n');
    
    // Check if parent_role and child_role columns exist
    const parentRoleColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_hierarchy' AND column_name = 'parent_role'
      )
    `;
    
    if (parentRoleColumnExists[0].exists) {
      console.log('  Dropping parent_role and child_role columns from role_hierarchy...');
      await prisma.$executeRawUnsafe(`ALTER TABLE role_hierarchy DROP COLUMN IF EXISTS parent_role`);
      await prisma.$executeRawUnsafe(`ALTER TABLE role_hierarchy DROP COLUMN IF EXISTS child_role`);
      console.log('  ✓ Dropped enum columns from role_hierarchy');
    } else {
      console.log('  ✓ role_hierarchy table is already correct');
    }
    
    console.log();
    
    // Step 11: Regenerate Prisma Client
    console.log('Step 11: Regenerating Prisma Client...\n');
    
    await prisma.$disconnect();
    
    try {
      execSync('npx prisma generate', { 
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      console.log('  ✓ Prisma Client regenerated\n');
    } catch (error) {
      console.error('  ✗ Failed to regenerate Prisma Client:', error.message);
      process.exit(1);
    }
    
    console.log('✅ SUCCESS: Schema drift has been fixed');
    console.log('\nSummary:');
    console.log('  ✓ All missing enum columns have been added to tables');
    console.log('  ✓ Data has been backed up');
    console.log('  ✓ Prisma Client has been regenerated');
    console.log('\nNext steps:');
    console.log('  1. Run: node scripts/validate-migrations.js');
    console.log('  2. Restart your application');
    console.log('  3. Your database is now ready for use');
    
  } catch (error) {
    console.error('\n❌ Failed to fix schema drift:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixSchemaDrift();
