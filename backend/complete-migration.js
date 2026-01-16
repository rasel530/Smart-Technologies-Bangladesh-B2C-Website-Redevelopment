/**
 * Complete migration script to handle enum changes and recreate conflicting tables
 * This script:
 * 1. Drops conflicting tables
 * 2. Applies schema changes
 * 3. Updates data to lowercase
 * 4. Recreates tables with new enum values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeMigration() {
  console.log('=== Starting Complete Migration ===\n');

  try {
    // Step 1: Drop conflicting tables
    console.log('Step 1: Dropping conflicting tables...');
    
    await prisma.$executeRaw`DROP TABLE IF EXISTS role_hierarchy CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS role_permission CASCADE`;
    console.log('✓ Dropped conflicting tables');

    // Step 2: Apply schema changes using db push
    console.log('\nStep 2: Applying schema changes...');
    
    // First, update all existing data to lowercase
    console.log('Updating existing data to lowercase...');
    
    // Update user roles
    await prisma.$executeRaw`
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
    `;
    console.log('✓ Updated user roles');

    // Update user statuses
    await prisma.$executeRaw`
      UPDATE users 
      SET status = CASE 
        WHEN status = 'ACTIVE' THEN 'active'
        WHEN status = 'INACTIVE' THEN 'inactive'
        WHEN status = 'SUSPENDED' THEN 'suspended'
        WHEN status = 'PENDING' THEN 'pending'
        ELSE status
      END
      WHERE status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')
    `;
    console.log('✓ Updated user statuses');

    // Update address types
    await prisma.$executeRaw`
      UPDATE addresses 
      SET type = CASE 
        WHEN type = 'SHIPPING' THEN 'shipping'
        WHEN type = 'BILLING' THEN 'billing'
        ELSE type
      END
      WHERE type IN ('SHIPPING', 'BILLING')
    `;
    console.log('✓ Updated address types');

    // Update product statuses
    await prisma.$executeRaw`
      UPDATE products 
      SET status = CASE 
        WHEN status = 'ACTIVE' THEN 'active'
        WHEN status = 'INACTIVE' THEN 'inactive'
        WHEN status = 'OUT_OF_STOCK' THEN 'out_of_stock'
        WHEN status = 'DISCONTINUED' THEN 'discontinued'
        ELSE status
      END
      WHERE status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')
    `;
    console.log('✓ Updated product statuses');

    // Update order statuses
    await prisma.$executeRaw`
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
    `;
    console.log('✓ Updated order statuses');

    // Update payment methods
    await prisma.$executeRaw`
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
    `;
    console.log('✓ Updated payment methods');

    // Update payment statuses
    await prisma.$executeRaw`
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
    `;
    console.log('✓ Updated payment statuses');

    // Update transaction payment statuses
    await prisma.$executeRaw`
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
    `;
    console.log('✓ Updated transaction payment statuses');

    // Update social providers
    await prisma.$executeRaw`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider = 'GOOGLE' THEN 'google'
        WHEN provider = 'FACEBOOK' THEN 'facebook'
        ELSE provider
      END
      WHERE provider IN ('GOOGLE', 'FACEBOOK')
    `;
    console.log('✓ Updated social providers');

    // Update coupon types
    await prisma.$executeRaw`
      UPDATE coupons 
      SET type = CASE 
        WHEN type = 'PERCENTAGE' THEN 'percentage'
        WHEN type = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type
      END
      WHERE type IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `;
    console.log('✓ Updated coupon types');

    // Update profile visibility
    await prisma.$executeRaw`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility" = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility" = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility" = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"
      END
      WHERE "profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `;
    console.log('✓ Updated profile visibility settings');

    console.log('\n✓ All data updated to lowercase');

    // Step 3: Drop and recreate enum types
    console.log('\nStep 3: Recreating enum types...');
    
    // Drop old enum types
    await prisma.$executeRaw`DROP TYPE IF EXISTS "UserRole" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "UserStatus" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "Division" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "AddressType" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "ProductStatus" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "OrderStatus" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "PaymentMethod" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "PaymentStatus" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "SocialProvider" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "CouponType" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "ProfileVisibility" CASCADE`;
    
    console.log('✓ Dropped old enum types');

    // Create new lowercase enum types
    await prisma.$executeRaw`CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate')`;
    await prisma.$executeRaw`CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending')`;
    await prisma.$executeRaw`CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh')`;
    await prisma.$executeRaw`CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing')`;
    await prisma.$executeRaw`CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued')`;
    await prisma.$executeRaw`CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`;
    await prisma.$executeRaw`CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket')`;
    await prisma.$executeRaw`CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')`;
    await prisma.$executeRaw`CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook')`;
    await prisma.$executeRaw`CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount')`;
    await prisma.$executeRaw`CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only')`;
    
    console.log('✓ Created new lowercase enum types');

    // Step 4: Recreate role_hierarchy table
    console.log('\nStep 4: Recreating role_hierarchy table...');
    await prisma.$executeRaw`
      CREATE TABLE role_hierarchy (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_role "UserRole" NOT NULL,
        child_role "UserRole" NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (parent_role, child_role)
      )
    `;
    console.log('✓ Recreated role_hierarchy table');

    // Step 5: Recreate role_permission table
    console.log('\nStep 5: Recreating role_permission table...');
    await prisma.$executeRaw`
      CREATE TABLE role_permission (
        role_id TEXT NOT NULL,
        permission_id TEXT NOT NULL,
        granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        granted_by TEXT,
        PRIMARY KEY (role_id, permission_id)
      )
    `;
    console.log('✓ Recreated role_permission table');

    console.log('\n=== Migration Complete ===');
    console.log('All enum values have been converted to lowercase.');
    console.log('Schema has been updated successfully.');
    console.log('\nNext steps:');
    console.log('1. Run: node create-admin-user.js');
    console.log('2. Restart backend server');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeMigration();
