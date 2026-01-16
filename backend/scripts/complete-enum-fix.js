/**
 * Complete Enum Fix Script
 * 
 * This script completely fixes enum types by:
 * 1. Dropping all old enum types (bypassing Prisma)
 * 2. Recreating all enum types with lowercase values
 * 3. Updating all data to use lowercase values
 * 4. Regenerating Prisma Client
 * 
 * Usage: node scripts/complete-enum-fix.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function completeEnumFix() {
  console.log('=== COMPLETE ENUM FIX ===\n');

  try {
    // Step 1: Drop all old enum types using raw SQL
    console.log('Step 1: Dropping all old enum types...\n');
    
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
    
    console.log('\n✓ All old enum types dropped\n');
    
    // Step 2: Recreate all enum types with lowercase values
    console.log('\nStep 2: Recreating all enum types with lowercase values...\n');
    
    // Recreate UserRole enum
    console.log('Recreating UserRole enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate')`);
    console.log('  ✓ Recreated UserRole enum\n');
    
    // Recreate UserStatus enum
    console.log('Recreating UserStatus enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending')`);
    console.log('  ✓ Recreated UserStatus enum\n');
    
    // Recreate Division enum
    console.log('Recreating Division enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh')`);
    console.log('  ✓ Recreated Division enum\n');
    
    // Recreate AddressType enum
    console.log('Recreating AddressType enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing')`);
    console.log('  ✓ Recreated AddressType enum\n');
    
    // Recreate ProductStatus enum
    console.log('Recreating ProductStatus enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued')`);
    console.log('  ✓ Recreated ProductStatus enum\n');
    
    // Recreate OrderStatus enum
    console.log('Recreating OrderStatus enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
    console.log('  ✓ Recreated OrderStatus enum\n');
    
    // Recreate PaymentMethod enum
    console.log('Recreating PaymentMethod enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket')`);
    console.log('  ✓ Recreated PaymentMethod enum\n');
    
    // Recreate PaymentStatus enum
    console.log('Recreating PaymentStatus enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')`);
    console.log('  ✓ Recreated PaymentStatus enum\n');
    
    // Recreate SocialProvider enum
    console.log('Recreating SocialProvider enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook')`);
    console.log('  ✓ Recreated SocialProvider enum\n');
    
    // Recreate CouponType enum
    console.log('Recreating CouponType enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount')`);
    console.log('  ✓ Recreated CouponType enum\n');
    
    // Recreate ProfileVisibility enum
    console.log('Recreating ProfileVisibility enum...');
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only')`);
    console.log('  ✓ Recreated ProfileVisibility enum\n');
    
    console.log('\n✓ All enum types recreated with lowercase values\n');
    
    // Step 3: Update all data to use lowercase values
    console.log('\nStep 3: Updating all data to use lowercase values...\n');
    
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
    console.log(`  ✓ Updated ${roleResult} user role(s)\n`);
    
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
    console.log(`  ✓ Updated ${statusResult} user status(es)\n`);
    
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
    console.log(`  ✓ Updated ${addressTypeResult} address type(s)\n`);
    
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
    console.log(`  ✓ Updated ${productStatusResult} product status(es)\n`);
    
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
    console.log(`  ✓ Updated ${orderStatusResult} order status(es)\n`);
    
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
    console.log(`  ✓ Updated ${paymentMethodResult} payment method(s)\n`);
    
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
    console.log(`  ✓ Updated ${paymentStatusResult} payment status(es)\n`);
    
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
    console.log(`  ✓ Updated ${transactionStatusResult} transaction status(es)\n`);
    
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
    console.log(`  ✓ Updated ${socialProviderResult} social provider(s)\n`);
    
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
    console.log(`  ✓ Updated ${couponTypeResult} coupon type(s)\n`);
    
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
    console.log(`  ✓ Updated ${profileVisibilityResult} profile visibility setting(s)\n`);
    
    console.log('\n✓ All data has been updated to lowercase\n');
    
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
    
    console.log('\n✅ SUCCESS: All enums and data have been fixed to lowercase');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/validate-migrations.js');
    console.log('2. Restart your application');
    
  } catch (error) {
    console.error('\n❌ Failed to complete enum fix:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

completeEnumFix();
