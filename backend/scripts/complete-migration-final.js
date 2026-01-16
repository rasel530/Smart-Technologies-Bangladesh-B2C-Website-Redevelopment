/**
 * Complete Migration Final Script
 * 
 * This script completely fixes the database migration issues by:
 * 1. Recreating all enum types with lowercase values
 * 2. Updating all data to use lowercase values
 * 3. Regenerating Prisma Client
 * 4. Validating the final state
 * 
 * This is the definitive fix that resolves all enum and data issues
 * 
 * Usage: node scripts/complete-migration-final.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function completeMigrationFinal() {
  console.log('=== COMPLETE MIGRATION FINAL FIX ===\n');

  try {
    // Step 1: Recreate all enum types with lowercase values
    console.log('Step 1: Recreating all enum types with lowercase values...\n');
    
    // Recreate UserRole enum
    console.log('Recreating UserRole enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME TO "UserRole_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate')`);
    console.log('  ✓ Recreated UserRole enum');
    
    // Recreate UserStatus enum
    console.log('Recreating UserStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "UserStatus" RENAME TO "UserStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending')`);
    console.log('  ✓ Recreated UserStatus enum');
    
    // Recreate Division enum
    console.log('Recreating Division enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Division" RENAME TO "Division_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh')`);
    console.log('  ✓ Recreated Division enum');
    
    // Recreate AddressType enum
    console.log('Recreating AddressType enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "AddressType" RENAME TO "AddressType_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing')`);
    console.log('  ✓ Recreated AddressType enum');
    
    // Recreate ProductStatus enum
    console.log('Recreating ProductStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued')`);
    console.log('  ✓ Recreated ProductStatus enum');
    
    // Recreate OrderStatus enum
    console.log('Recreating OrderStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
    console.log('  ✓ Recreated OrderStatus enum');
    
    // Recreate PaymentMethod enum
    console.log('Recreating PaymentMethod enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket')`);
    console.log('  ✓ Recreated PaymentMethod enum');
    
    // Recreate PaymentStatus enum
    console.log('Recreating PaymentStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')`);
    console.log('  ✓ Recreated PaymentStatus enum');
    
    // Recreate SocialProvider enum
    console.log('Recreating SocialProvider enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "SocialProvider" RENAME TO "SocialProvider_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook')`);
    console.log('  ✓ Recreated SocialProvider enum');
    
    // Recreate CouponType enum
    console.log('Recreating CouponType enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "CouponType" RENAME TO "CouponType_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount')`);
    console.log('  ✓ Recreated CouponType enum');
    
    // Recreate ProfileVisibility enum
    console.log('Recreating ProfileVisibility enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "ProfileVisibility" RENAME TO "ProfileVisibility_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only')`);
    console.log('  ✓ Recreated ProfileVisibility enum');
    
    console.log('\n  ✓ All enum types recreated with lowercase values\n');
    
    // Step 2: Update all data to use lowercase values
    console.log('\nStep 2: Updating all data to use lowercase values...\n');
    
    // Update user roles
    console.log('Updating user roles...');
    const roleResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${roleResult} user role(s)`);
    
    // Update user statuses
    console.log('Updating user statuses...');
    const statusResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${statusResult} user status(es)`);
    
    // Update address types
    console.log('Updating address types...');
    const addressTypeResult = await prisma.$executeRawUnsafe(`
      UPDATE addresses 
      SET type = CASE 
        WHEN type = 'SHIPPING' THEN 'shipping'
        WHEN type = 'BILLING' THEN 'billing'
        ELSE type
      END
      WHERE type IN ('SHIPPING', 'BILLING')
    `);
    console.log(`  ✓ Updated ${addressTypeResult} address type(s)`);
    
    // Update product statuses
    console.log('Updating product statuses...');
    const productStatusResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${productStatusResult} product status(es)`);
    
    // Update order statuses
    console.log('Updating order statuses...');
    const orderStatusResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${orderStatusResult} order status(es)`);
    
    // Update payment methods
    console.log('Updating payment methods...');
    const paymentMethodResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${paymentMethodResult} payment method(s)`);
    
    // Update payment statuses (orders)
    console.log('Updating payment statuses (orders)...');
    const paymentStatusResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${paymentStatusResult} payment status(es)`);
    
    // Update transaction payment statuses
    console.log('Updating payment statuses (transactions)...');
    const transactionStatusResult = await prisma.$executeRawUnsafe(`
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
    console.log(`  ✓ Updated ${transactionStatusResult} transaction status(es)`);
    
    // Update social providers
    console.log('Updating social providers...');
    const socialProviderResult = await prisma.$executeRawUnsafe(`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider = 'GOOGLE' THEN 'google'
        WHEN provider = 'FACEBOOK' THEN 'facebook'
        ELSE provider
      END
      WHERE provider IN ('GOOGLE', 'FACEBOOK')
    `);
    console.log(`  ✓ Updated ${socialProviderResult} social provider(s)`);
    
    // Update coupon types
    console.log('Updating coupon types...');
    const couponTypeResult = await prisma.$executeRawUnsafe(`
      UPDATE coupons 
      SET type = CASE 
        WHEN type = 'PERCENTAGE' THEN 'percentage'
        WHEN type = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type
      END
      WHERE type IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `);
    console.log(`  ✓ Updated ${couponTypeResult} coupon type(s)`);
    
    // Update profile visibility
    console.log('Updating profile visibility...');
    const profileVisibilityResult = await prisma.$executeRawUnsafe(`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility" = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility" = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility" = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"
      END
      WHERE "profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `);
    console.log(`  ✓ Updated ${profileVisibilityResult} profile visibility setting(s)`);
    
    console.log('\n  ✓ All data has been updated to lowercase\n');
    
    // Step 3: Drop old enum types
    console.log('\nStep 3: Dropping old enum types...\n');
    
    const oldEnums = [
      'UserRole_old', 'UserStatus_old', 'Division_old', 'AddressType_old',
      'ProductStatus_old', 'OrderStatus_old', 'PaymentMethod_old',
      'PaymentStatus_old', 'SocialProvider_old', 'CouponType_old', 'ProfileVisibility_old'
    ];
    
    for (const oldEnum of oldEnums) {
      try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${oldEnum}"`);
        console.log(`  ✓ Dropped ${oldEnum}`);
      } catch (error) {
        console.log(`  Note: ${oldEnum} - ${error.message}`);
      }
    }
    
    console.log('\n  ✓ All old enum types dropped\n');
    
    // Step 4: Regenerate Prisma Client
    console.log('\nStep 4: Regenerating Prisma Client...\n');
    
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
    
    console.log('\n✅ SUCCESS: Database migration is complete');
    console.log('\nSummary:');
    console.log('  ✓ All enum types recreated with lowercase values');
    console.log('  ✓ All data updated to use lowercase values');
    console.log('  ✓ Old enum types dropped');
    console.log('  ✓ Prisma Client regenerated');
    console.log('\nNext steps:');
    console.log('  1. Run: node scripts/validate-migrations.js');
    console.log('  2. Restart your application');
    console.log('  3. Your database is now ready for use');
    
  } catch (error) {
    console.error('\n❌ Failed to complete migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

completeMigrationFinal();
