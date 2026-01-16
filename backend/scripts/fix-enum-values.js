/**
 * Fix Enum Values Script
 * 
 * This script fixes enum values in the database to match the schema
 * (lowercase values as defined in schema.prisma)
 * 
 * Usage: node scripts/fix-enum-values.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEnumValues() {
  console.log('=== FIXING ENUM VALUES ===\n');

  try {
    // Check current enum values in database
    console.log('Checking current enum values in database...');
    
    const userRoles = await prisma.$queryRaw`SELECT DISTINCT role FROM users`;
    console.log('\nCurrent user roles in database:');
    userRoles.forEach(u => {
      console.log(`  - ${u.role}`);
    });
    
    const userStatuses = await prisma.$queryRaw`SELECT DISTINCT status FROM users`;
    console.log('\nCurrent user statuses in database:');
    userStatuses.forEach(u => {
      console.log(`  - ${u.status}`);
    });
    
    // Fix user roles
    console.log('\n🔄 Fixing user roles...');
    const roleUpdateResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${roleUpdateResult} user role(s)`);
    
    // Fix user statuses
    console.log('\n🔄 Fixing user statuses...');
    const statusUpdateResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${statusUpdateResult} user status(es)`);
    
    // Fix address types
    console.log('\n🔄 Fixing address types...');
    const addressTypeResult = await prisma.$executeRaw`
      UPDATE addresses 
      SET type = CASE 
        WHEN type = 'SHIPPING' THEN 'shipping'
        WHEN type = 'BILLING' THEN 'billing'
        ELSE type
      END
      WHERE type IN ('SHIPPING', 'BILLING')
    `;
    console.log(`✅ Updated ${addressTypeResult} address type(s)`);
    
    // Fix product statuses
    console.log('\n🔄 Fixing product statuses...');
    const productStatusResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${productStatusResult} product status(es)`);
    
    // Fix order statuses
    console.log('\n🔄 Fixing order statuses...');
    const orderStatusResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${orderStatusResult} order status(es)`);
    
    // Fix payment methods
    console.log('\n🔄 Fixing payment methods...');
    const paymentMethodResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${paymentMethodResult} payment method(s)`);
    
    // Fix payment statuses
    console.log('\n🔄 Fixing payment statuses (orders)...');
    const paymentStatusResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${paymentStatusResult} payment status(es)`);
    
    // Fix transaction payment statuses
    console.log('\n🔄 Fixing payment statuses (transactions)...');
    const transactionStatusResult = await prisma.$executeRaw`
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
    console.log(`✅ Updated ${transactionStatusResult} transaction status(es)`);
    
    // Fix social providers
    console.log('\n🔄 Fixing social providers...');
    const socialProviderResult = await prisma.$executeRaw`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider = 'GOOGLE' THEN 'google'
        WHEN provider = 'FACEBOOK' THEN 'facebook'
        ELSE provider
      END
      WHERE provider IN ('GOOGLE', 'FACEBOOK')
    `;
    console.log(`✅ Updated ${socialProviderResult} social provider(s)`);
    
    // Fix coupon types
    console.log('\n🔄 Fixing coupon types...');
    const couponTypeResult = await prisma.$executeRaw`
      UPDATE coupons 
      SET type = CASE 
        WHEN type = 'PERCENTAGE' THEN 'percentage'
        WHEN type = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type
      END
      WHERE type IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `;
    console.log(`✅ Updated ${couponTypeResult} coupon type(s)`);
    
    // Fix profile visibility
    console.log('\n🔄 Fixing profile visibility...');
    const profileVisibilityResult = await prisma.$executeRaw`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility" = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility" = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility" = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"
      END
      WHERE "profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `;
    console.log(`✅ Updated ${profileVisibilityResult} profile visibility setting(s)`);
    
    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const finalUserRoles = await prisma.$queryRaw`SELECT DISTINCT role FROM users`;
    console.log('\nFinal user roles in database:');
    finalUserRoles.forEach(u => {
      console.log(`  - ${u.role}`);
    });
    
    const finalUserStatuses = await prisma.$queryRaw`SELECT DISTINCT status FROM users`;
    console.log('\nFinal user statuses in database:');
    finalUserStatuses.forEach(u => {
      console.log(`  - ${u.status}`);
    });
    
    console.log('\n✅ SUCCESS: All enum values have been fixed to lowercase');
    console.log('You can now run: node scripts/validate-migrations.js');
    
  } catch (error) {
    console.error('\n❌ Failed to fix enum values:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnumValues();
