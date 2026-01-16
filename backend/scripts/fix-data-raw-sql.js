/**
 * Fix Data Using Raw SQL Script
 * 
 * This script updates enum data values to lowercase using raw SQL
 * to bypass Prisma's enum validation
 * 
 * Usage: node scripts/fix-data-raw-sql.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDataUsingRawSQL() {
  console.log('=== FIXING DATA USING RAW SQL ===\n');

  try {
    // Update user roles using raw SQL
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
    console.log(`✓ Updated ${roleResult} user role(s)\n`);
    
    // Update user statuses using raw SQL
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
    console.log(`✓ Updated ${statusResult} user status(es)\n`);
    
    // Update address types using raw SQL
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
    console.log(`✓ Updated ${addressTypeResult} address type(s)\n`);
    
    // Update product statuses using raw SQL
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
    console.log(`✓ Updated ${productStatusResult} product status(es)\n`);
    
    // Update order statuses using raw SQL
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
    console.log(`✓ Updated ${orderStatusResult} order status(es)\n`);
    
    // Update payment methods using raw SQL
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
    console.log(`✓ Updated ${paymentMethodResult} payment method(s)\n`);
    
    // Update payment statuses (orders) using raw SQL
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
    console.log(`✓ Updated ${paymentStatusResult} payment status(es)\n`);
    
    // Update transaction payment statuses using raw SQL
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
    console.log(`✓ Updated ${transactionStatusResult} transaction status(es)\n`);
    
    // Update social providers using raw SQL
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
    console.log(`✓ Updated ${socialProviderResult} social provider(s)\n`);
    
    // Update coupon types using raw SQL
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
    console.log(`✓ Updated ${couponTypeResult} coupon type(s)\n`);
    
    // Update profile visibility using raw SQL
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
    console.log(`✓ Updated ${profileVisibilityResult} profile visibility setting(s)\n`);
    
    console.log('\n✅ SUCCESS: All data has been updated to lowercase');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: node scripts/validate-migrations.js');
    console.log('3. Restart your application');
    
  } catch (error) {
    console.error('\n❌ Failed to fix data:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixDataUsingRawSQL();
