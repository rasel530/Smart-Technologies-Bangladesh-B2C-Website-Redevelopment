/**
 * Fix Enums Properly Script
 * 
 * This script fixes enum types by:
 * 1. First recreating enum types with lowercase values
 * 2. Then updating data to use lowercase values
 * 
 * Usage: node scripts/fix-enums-proper.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEnumsProperly() {
  console.log('=== FIXING ENUMS PROPERLY ===\n');

  try {
    // Step 1: Recreate enum types with lowercase values
    console.log('Step 1: Recreating enum types with lowercase values...\n');
    
    // Recreate UserRole enum
    console.log('Recreating UserRole enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "UserRole" RENAME TO "UserRole_old";
      CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate');
    `);
    console.log('✓ Recreated UserRole enum\n');
    
    // Recreate UserStatus enum
    console.log('Recreating UserStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
      CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');
    `);
    console.log('✓ Recreated UserStatus enum\n');
    
    // Recreate Division enum
    console.log('Recreating Division enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "Division" RENAME TO "Division_old";
      CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh');
    `);
    console.log('✓ Recreated Division enum\n');
    
    // Recreate AddressType enum
    console.log('Recreating AddressType enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "AddressType" RENAME TO "AddressType_old";
      CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing');
    `);
    console.log('✓ Recreated AddressType enum\n');
    
    // Recreate ProductStatus enum
    console.log('Recreating ProductStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
      CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');
    `);
    console.log('✓ Recreated ProductStatus enum\n');
    
    // Recreate OrderStatus enum
    console.log('Recreating OrderStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
      CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
    `);
    console.log('✓ Recreated OrderStatus enum\n');
    
    // Recreate PaymentMethod enum
    console.log('Recreating PaymentMethod enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
      CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket');
    `);
    console.log('✓ Recreated PaymentMethod enum\n');
    
    // Recreate PaymentStatus enum
    console.log('Recreating PaymentStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
      CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
    `);
    console.log('✓ Recreated PaymentStatus enum\n');
    
    // Recreate SocialProvider enum
    console.log('Recreating SocialProvider enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "SocialProvider" RENAME TO "SocialProvider_old";
      CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook');
    `);
    console.log('✓ Recreated SocialProvider enum\n');
    
    // Recreate CouponType enum
    console.log('Recreating CouponType enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "CouponType" RENAME TO "CouponType_old";
      CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount');
    `);
    console.log('✓ Recreated CouponType enum\n');
    
    // Recreate ProfileVisibility enum
    console.log('Recreating ProfileVisibility enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "ProfileVisibility" RENAME TO "ProfileVisibility_old";
      CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only');
    `);
    console.log('✓ Recreated ProfileVisibility enum\n');
    
    console.log('✓ All enum types recreated with lowercase values\n');
    
    // Step 2: Update data to use lowercase values
    console.log('\nStep 2: Updating data to use lowercase values...\n');
    
    // Update user roles
    console.log('Updating user roles...');
    const roleUpdateResult = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = CASE 
        WHEN role::text = 'ADMIN' THEN 'admin'
        WHEN role::text = 'MANAGER' THEN 'manager'
        WHEN role::text = 'SUPER_ADMIN' THEN 'super_admin'
        WHEN role::text = 'SUPPORT' THEN 'support'
        WHEN role::text = 'CORPORATE' THEN 'corporate'
        WHEN role::text = 'CUSTOMER' THEN 'customer'
        ELSE role::text
      END
      WHERE role::text IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE', 'CUSTOMER')
    `);
    console.log(`✓ Updated ${roleUpdateResult} user role(s)\n`);
    
    // Update user statuses
    console.log('Updating user statuses...');
    const statusUpdateResult = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET status = CASE 
        WHEN status::text = 'ACTIVE' THEN 'active'
        WHEN status::text = 'INACTIVE' THEN 'inactive'
        WHEN status::text = 'SUSPENDED' THEN 'suspended'
        WHEN status::text = 'PENDING' THEN 'pending'
        ELSE status::text
      END
      WHERE status::text IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')
    `);
    console.log(`✓ Updated ${statusUpdateResult} user status(es)\n`);
    
    // Update address types
    console.log('Updating address types...');
    const addressTypeResult = await prisma.$executeRawUnsafe(`
      UPDATE addresses 
      SET type = CASE 
        WHEN type::text = 'SHIPPING' THEN 'shipping'
        WHEN type::text = 'BILLING' THEN 'billing'
        ELSE type::text
      END
      WHERE type::text IN ('SHIPPING', 'BILLING')
    `);
    console.log(`✓ Updated ${addressTypeResult} address type(s)\n`);
    
    // Update product statuses
    console.log('Updating product statuses...');
    const productStatusResult = await prisma.$executeRawUnsafe(`
      UPDATE products 
      SET status = CASE 
        WHEN status::text = 'ACTIVE' THEN 'active'
        WHEN status::text = 'INACTIVE' THEN 'inactive'
        WHEN status::text = 'OUT_OF_STOCK' THEN 'out_of_stock'
        WHEN status::text = 'DISCONTINUED' THEN 'discontinued'
        ELSE status::text
      END
      WHERE status::text IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')
    `);
    console.log(`✓ Updated ${productStatusResult} product status(es)\n`);
    
    // Update order statuses
    console.log('Updating order statuses...');
    const orderStatusResult = await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET status = CASE 
        WHEN status::text = 'PENDING' THEN 'pending'
        WHEN status::text = 'CONFIRMED' THEN 'confirmed'
        WHEN status::text = 'PROCESSING' THEN 'processing'
        WHEN status::text = 'SHIPPED' THEN 'shipped'
        WHEN status::text = 'DELIVERED' THEN 'delivered'
        WHEN status::text = 'CANCELLED' THEN 'cancelled'
        WHEN status::text = 'REFUNDED' THEN 'refunded'
        ELSE status::text
      END
      WHERE status::text IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')
    `);
    console.log(`✓ Updated ${orderStatusResult} order status(es)\n`);
    
    // Update payment methods
    console.log('Updating payment methods...');
    const paymentMethodResult = await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET "paymentMethod" = CASE 
        WHEN "paymentMethod"::text = 'CREDIT_CARD' THEN 'credit_card'
        WHEN "paymentMethod"::text = 'BANK_TRANSFER' THEN 'bank_transfer'
        WHEN "paymentMethod"::text = 'CASH_ON_DELIVERY' THEN 'cash_on_delivery'
        WHEN "paymentMethod"::text = 'BKASH' THEN 'bkash'
        WHEN "paymentMethod"::text = 'NAGAD' THEN 'nagad'
        WHEN "paymentMethod"::text = 'ROCKET' THEN 'rocket'
        ELSE "paymentMethod"::text
      END
      WHERE "paymentMethod"::text IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET')
    `);
    console.log(`✓ Updated ${paymentMethodResult} payment method(s)\n`);
    
    // Update payment statuses (orders)
    console.log('Updating payment statuses (orders)...');
    const paymentStatusResult = await prisma.$executeRawUnsafe(`
      UPDATE orders 
      SET "paymentStatus" = CASE 
        WHEN "paymentStatus"::text = 'PENDING' THEN 'pending'
        WHEN "paymentStatus"::text = 'PROCESSING' THEN 'processing'
        WHEN "paymentStatus"::text = 'COMPLETED' THEN 'completed'
        WHEN "paymentStatus"::text = 'FAILED' THEN 'failed'
        WHEN "paymentStatus"::text = 'CANCELLED' THEN 'cancelled'
        WHEN "paymentStatus"::text = 'REFUNDED' THEN 'refunded'
        ELSE "paymentStatus"::text
      END
      WHERE "paymentStatus"::text IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')
    `);
    console.log(`✓ Updated ${paymentStatusResult} payment status(es)\n`);
    
    // Update transaction payment statuses
    console.log('Updating payment statuses (transactions)...');
    const transactionStatusResult = await prisma.$executeRawUnsafe(`
      UPDATE transactions 
      SET status = CASE 
        WHEN status::text = 'PENDING' THEN 'pending'
        WHEN status::text = 'PROCESSING' THEN 'processing'
        WHEN status::text = 'COMPLETED' THEN 'completed'
        WHEN status::text = 'FAILED' THEN 'failed'
        WHEN status::text = 'CANCELLED' THEN 'cancelled'
        WHEN status::text = 'REFUNDED' THEN 'refunded'
        ELSE status::text
      END
      WHERE status::text IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')
    `);
    console.log(`✓ Updated ${transactionStatusResult} transaction status(es)\n`);
    
    // Update social providers
    console.log('Updating social providers...');
    const socialProviderResult = await prisma.$executeRawUnsafe(`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider::text = 'GOOGLE' THEN 'google'
        WHEN provider::text = 'FACEBOOK' THEN 'facebook'
        ELSE provider::text
      END
      WHERE provider::text IN ('GOOGLE', 'FACEBOOK')
    `);
    console.log(`✓ Updated ${socialProviderResult} social provider(s)\n`);
    
    // Update coupon types
    console.log('Updating coupon types...');
    const couponTypeResult = await prisma.$executeRawUnsafe(`
      UPDATE coupons 
      SET type = CASE 
        WHEN type::text = 'PERCENTAGE' THEN 'percentage'
        WHEN type::text = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type::text
      END
      WHERE type::text IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `);
    console.log(`✓ Updated ${couponTypeResult} coupon type(s)\n`);
    
    // Update profile visibility
    console.log('Updating profile visibility...');
    const profileVisibilityResult = await prisma.$executeRawUnsafe(`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility"::text = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility"::text = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility"::text = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"::text
      END
      WHERE "profileVisibility"::text IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `);
    console.log(`✓ Updated ${profileVisibilityResult} profile visibility setting(s)\n`);
    
    // Step 3: Drop old enum types
    console.log('\nStep 3: Cleaning up old enum types...\n');
    
    const oldEnums = [
      'UserRole_old', 'UserStatus_old', 'Division_old', 'AddressType_old',
      'ProductStatus_old', 'OrderStatus_old', 'PaymentMethod_old',
      'PaymentStatus_old', 'SocialProvider_old', 'CouponType_old', 'ProfileVisibility_old'
    ];
    
    for (const oldEnum of oldEnums) {
      try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${oldEnum}"`);
        console.log(`✓ Dropped ${oldEnum}`);
      } catch (error) {
        console.log(`  Note: ${oldEnum} may not exist or is still in use`);
      }
    }
    
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

fixEnumsProperly();
