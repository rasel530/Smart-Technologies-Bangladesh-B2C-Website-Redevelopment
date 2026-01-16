/**
 * Fix Enums to Lowercase Script
 * 
 * This script fixes enum types by:
 * 1. Updating all data to lowercase values
 * 2. Dropping old enum types
 * 3. Recreating enum types with lowercase values
 * 
 * Usage: node scripts/fix-enums-lowercase.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEnumsToLowercase() {
  console.log('=== FIXING ENUMS TO LOWERCASE ===\n');

  try {
    // Step 1: Update all data to lowercase first
    console.log('Step 1: Updating all enum values to lowercase...\n');
    
    // Update user roles
    console.log('Updating user roles...');
    await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'ADMIN' THEN 'admin'
        WHEN role = 'MANAGER' THEN 'manager'
        WHEN role = 'SUPER_ADMIN' THEN 'super_admin'
        WHEN role = 'SUPPORT' THEN 'support'
        WHEN role = 'CORPORATE' THEN 'corporate'
        WHEN role = 'CUSTOMER' THEN 'customer'
        ELSE role
      END
      WHERE role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE', 'CUSTOMER')
    `);
    console.log('✓ Updated user roles\n');
    
    // Update user statuses
    console.log('Updating user statuses...');
    await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET status = CASE 
        WHEN status = 'ACTIVE' THEN 'active'
        WHEN status = 'INACTIVE' THEN 'inactive'
        WHEN status = 'SUSPENDED' THEN 'suspended'
        WHEN status = 'PENDING' THEN 'pending'
        ELSE status
      END
      WHERE status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')
    `);
    console.log('✓ Updated user statuses\n');
    
    // Update address types
    console.log('Updating address types...');
    await prisma.$executeRawUnsafe(`
      UPDATE addresses 
      SET type = CASE 
        WHEN type = 'SHIPPING' THEN 'shipping'
        WHEN type = 'BILLING' THEN 'billing'
        ELSE type
      END
      WHERE type IN ('SHIPPING', 'BILLING')
    `);
    console.log('✓ Updated address types\n');
    
    // Update product statuses
    console.log('Updating product statuses...');
    await prisma.$executeRawUnsafe(`
      UPDATE products 
      SET status = CASE 
        WHEN status = 'ACTIVE' THEN 'active'
        WHEN status = 'INACTIVE' THEN 'inactive'
        WHEN status = 'OUT_OF_STOCK' THEN 'out_of_stock'
        WHEN status = 'DISCONTINUED' THEN 'discontinued'
        ELSE status
      END
      WHERE status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')
    `);
    console.log('✓ Updated product statuses\n');
    
    // Update order statuses
    console.log('Updating order statuses...');
    await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET status = CASE 
        WHEN status = 'PENDING' THEN 'pending'
        WHEN status = 'CONFIRMED' THEN 'confirmed'
        WHEN status = 'PROCESSING' THEN 'processing'
        WHEN status = 'SHIPPED' THEN 'shipped'
        WHEN status = 'DELIVERED' THEN 'delivered'
        WHEN status = 'CANCELLED' THEN 'cancelled'
        WHEN status = 'REFUNDED' THEN 'refunded'
        ELSE status
      END
      WHERE status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')
    `);
    console.log('✓ Updated order statuses\n');
    
    // Update payment methods
    console.log('Updating payment methods...');
    await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET "paymentMethod" = CASE 
        WHEN "paymentMethod" = 'CREDIT_CARD' THEN 'credit_card'
        WHEN "paymentMethod" = 'BANK_TRANSFER' THEN 'bank_transfer'
        WHEN "paymentMethod" = 'CASH_ON_DELIVERY' THEN 'cash_on_delivery'
        WHEN "paymentMethod" = 'BKASH' THEN 'bkash'
        WHEN "paymentMethod" = 'NAGAD' THEN 'nagad'
        WHEN "paymentMethod" = 'ROCKET' THEN 'rocket'
        ELSE "paymentMethod"
      END
      WHERE "paymentMethod" IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET')
    `);
    console.log('✓ Updated payment methods\n');
    
    // Update payment statuses (orders)
    console.log('Updating payment statuses (orders)...');
    await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET "paymentStatus" = CASE 
        WHEN "paymentStatus" = 'PENDING' THEN 'pending'
        WHEN "paymentStatus" = 'PROCESSING' THEN 'processing'
        WHEN "paymentStatus" = 'COMPLETED' THEN 'completed'
        WHEN "paymentStatus" = 'FAILED' THEN 'failed'
        WHEN "paymentStatus" = 'CANCELLED' THEN 'cancelled'
        WHEN "paymentStatus" = 'REFUNDED' THEN 'refunded'
        ELSE "paymentStatus"
      END
      WHERE "paymentStatus" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')
    `);
    console.log('✓ Updated payment statuses (orders)\n');
    
    // Update transaction payment statuses
    console.log('Updating payment statuses (transactions)...');
    await prisma.$executeRawUnsafe(`
      UPDATE transactions 
      SET status = CASE 
        WHEN status = 'PENDING' THEN 'pending'
        WHEN status = 'PROCESSING' THEN 'processing'
        WHEN status = 'COMPLETED' THEN 'completed'
        WHEN status = 'FAILED' THEN 'failed'
        WHEN status = 'CANCELLED' THEN 'cancelled'
        WHEN status = 'REFUNDED' THEN 'refunded'
        ELSE status
      END
      WHERE status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')
    `);
    console.log('✓ Updated payment statuses (transactions)\n');
    
    // Update social providers
    console.log('Updating social providers...');
    await prisma.$executeRawUnsafe(`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider = 'GOOGLE' THEN 'google'
        WHEN provider = 'FACEBOOK' THEN 'facebook'
        ELSE provider
      END
      WHERE provider IN ('GOOGLE', 'FACEBOOK')
    `);
    console.log('✓ Updated social providers\n');
    
    // Update coupon types
    console.log('Updating coupon types...');
    await prisma.$executeRawUnsafe(`
      UPDATE coupons 
      SET type = CASE 
        WHEN type = 'PERCENTAGE' THEN 'percentage'
        WHEN type = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type
      END
      WHERE type IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `);
    console.log('✓ Updated coupon types\n');
    
    // Update profile visibility
    console.log('Updating profile visibility...');
    await prisma.$executeRawUnsafe(`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility" = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility" = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility" = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"
      END
      WHERE "profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `);
    console.log('✓ Updated profile visibility\n');
    
    console.log('✓ All data updated to lowercase\n');
    
    // Step 2: Drop old enum types and recreate with lowercase
    console.log('\nStep 2: Recreating enum types with lowercase values...\n');
    
    // Drop and recreate UserRole enum
    console.log('Recreating UserRole enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
      ALTER TYPE "UserRole" RENAME TO "UserRole_old";
      CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate');
      ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::text::"UserRole";
      ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
      DROP TYPE "UserRole_old";
    `);
    console.log('✓ Recreated UserRole enum\n');
    
    // Drop and recreate UserStatus enum
    console.log('Recreating UserStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ALTER COLUMN status DROP DEFAULT;
      ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
      CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');
      ALTER TABLE users ALTER COLUMN status TYPE "UserStatus" USING status::text::"UserStatus";
      ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
      DROP TYPE "UserStatus_old";
    `);
    console.log('✓ Recreated UserStatus enum\n');
    
    // Drop and recreate Division enum
    console.log('Recreating Division enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE addresses ALTER COLUMN division DROP DEFAULT;
      ALTER TYPE "Division" RENAME TO "Division_old";
      CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh');
      ALTER TABLE addresses ALTER COLUMN division TYPE "Division" USING division::text::"Division";
      ALTER TABLE addresses ALTER COLUMN division SET DEFAULT 'dhaka';
      DROP TYPE "Division_old";
    `);
    console.log('✓ Recreated Division enum\n');
    
    // Drop and recreate AddressType enum
    console.log('Recreating AddressType enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE addresses ALTER COLUMN type DROP DEFAULT;
      ALTER TYPE "AddressType" RENAME TO "AddressType_old";
      CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing');
      ALTER TABLE addresses ALTER COLUMN type TYPE "AddressType" USING type::text::"AddressType";
      ALTER TABLE addresses ALTER COLUMN type SET DEFAULT 'shipping';
      DROP TYPE "AddressType_old";
    `);
    console.log('✓ Recreated AddressType enum\n');
    
    // Drop and recreate ProductStatus enum
    console.log('Recreating ProductStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products ALTER COLUMN status DROP DEFAULT;
      ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
      CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');
      ALTER TABLE products ALTER COLUMN status TYPE "ProductStatus" USING status::text::"ProductStatus";
      ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active';
      DROP TYPE "ProductStatus_old";
    `);
    console.log('✓ Recreated ProductStatus enum\n');
    
    // Drop and recreate OrderStatus enum
    console.log('Recreating OrderStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
      ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
      CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
      ALTER TABLE orders ALTER COLUMN status TYPE "OrderStatus" USING status::text::"OrderStatus";
      ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
      DROP TYPE "OrderStatus_old";
    `);
    console.log('✓ Recreated OrderStatus enum\n');
    
    // Drop and recreate PaymentMethod enum
    console.log('Recreating PaymentMethod enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders ALTER COLUMN "paymentMethod" DROP DEFAULT;
      ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
      CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket');
      ALTER TABLE orders ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::text::"PaymentMethod";
      ALTER TABLE transactions ALTER COLUMN paymentMethod TYPE "PaymentMethod" USING paymentMethod::text::"PaymentMethod";
      DROP TYPE "PaymentMethod_old";
    `);
    console.log('✓ Recreated PaymentMethod enum\n');
    
    // Drop and recreate PaymentStatus enum
    console.log('Recreating PaymentStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders ALTER COLUMN "paymentStatus" DROP DEFAULT;
      ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
      CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
      ALTER TABLE orders ALTER COLUMN "paymentStatus" TYPE "PaymentStatus" USING "paymentStatus"::text::"PaymentStatus";
      ALTER TABLE transactions ALTER COLUMN status TYPE "PaymentStatus" USING status::text::"PaymentStatus";
      DROP TYPE "PaymentStatus_old";
    `);
    console.log('✓ Recreated PaymentStatus enum\n');
    
    // Drop and recreate SocialProvider enum
    console.log('Recreating SocialProvider enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE user_social_accounts ALTER COLUMN provider DROP DEFAULT;
      ALTER TYPE "SocialProvider" RENAME TO "SocialProvider_old";
      CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook');
      ALTER TABLE user_social_accounts ALTER COLUMN provider TYPE "SocialProvider" USING provider::text::"SocialProvider";
      DROP TYPE "SocialProvider_old";
    `);
    console.log('✓ Recreated SocialProvider enum\n');
    
    // Drop and recreate CouponType enum
    console.log('Recreating CouponType enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE coupons ALTER COLUMN type DROP DEFAULT;
      ALTER TYPE "CouponType" RENAME TO "CouponType_old";
      CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount');
      ALTER TABLE coupons ALTER COLUMN type TYPE "CouponType" USING type::text::"CouponType";
      DROP TYPE "CouponType_old";
    `);
    console.log('✓ Recreated CouponType enum\n');
    
    // Drop and recreate ProfileVisibility enum
    console.log('Recreating ProfileVisibility enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE user_privacy_settings ALTER COLUMN "profileVisibility" DROP DEFAULT;
      ALTER TYPE "ProfileVisibility" RENAME TO "ProfileVisibility_old";
      CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only');
      ALTER TABLE user_privacy_settings ALTER COLUMN "profileVisibility" TYPE "ProfileVisibility" USING "profileVisibility"::text::"ProfileVisibility";
      ALTER TABLE user_privacy_settings ALTER COLUMN "profileVisibility" SET DEFAULT 'private';
      DROP TYPE "ProfileVisibility_old";
    `);
    console.log('✓ Recreated ProfileVisibility enum\n');
    
    console.log('\n✅ SUCCESS: All enums have been fixed to lowercase');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: node scripts/validate-migrations.js');
    console.log('3. Restart your application');
    
  } catch (error) {
    console.error('\n❌ Failed to fix enums:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnumsToLowercase();
