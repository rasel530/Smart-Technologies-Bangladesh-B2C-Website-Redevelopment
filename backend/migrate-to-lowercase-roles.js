/**
 * Migration script to convert uppercase enum values to lowercase
 * This updates existing data to match the new lowercase enum values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToLowercase() {
  console.log('=== Starting Migration to Lowercase Enums ===\n');

  try {
    // Update user roles to lowercase
    console.log('Updating user roles...');
    const roleUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${roleUpdates} user roles`);

    // Update user status to lowercase
    console.log('\nUpdating user statuses...');
    const statusUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${statusUpdates} user statuses`);

    // Update address types to lowercase
    console.log('\nUpdating address types...');
    const addressTypeUpdates = await prisma.$executeRaw`
      UPDATE addresses 
      SET type = CASE 
        WHEN type = 'SHIPPING' THEN 'shipping'
        WHEN type = 'BILLING' THEN 'billing'
        ELSE type
      END
      WHERE type IN ('SHIPPING', 'BILLING')
    `;
    console.log(`✓ Updated ${addressTypeUpdates} address types`);

    // Update product statuses to lowercase
    console.log('\nUpdating product statuses...');
    const productStatusUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${productStatusUpdates} product statuses`);

    // Update order statuses to lowercase
    console.log('\nUpdating order statuses...');
    const orderStatusUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${orderStatusUpdates} order statuses`);

    // Update payment methods to lowercase
    console.log('\nUpdating payment methods...');
    const paymentMethodUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${paymentMethodUpdates} payment methods`);

    // Update payment statuses to lowercase
    console.log('\nUpdating payment statuses...');
    const paymentStatusUpdates = await prisma.$executeRaw`
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
    console.log(`✓ Updated ${paymentStatusUpdates} payment statuses`);

    // Update social providers to lowercase
    console.log('\nUpdating social providers...');
    const socialProviderUpdates = await prisma.$executeRaw`
      UPDATE user_social_accounts 
      SET provider = CASE 
        WHEN provider = 'GOOGLE' THEN 'google'
        WHEN provider = 'FACEBOOK' THEN 'facebook'
        ELSE provider
      END
      WHERE provider IN ('GOOGLE', 'FACEBOOK')
    `;
    console.log(`✓ Updated ${socialProviderUpdates} social providers`);

    // Update coupon types to lowercase
    console.log('\nUpdating coupon types...');
    const couponTypeUpdates = await prisma.$executeRaw`
      UPDATE coupons 
      SET type = CASE 
        WHEN type = 'PERCENTAGE' THEN 'percentage'
        WHEN type = 'FIXED_AMOUNT' THEN 'fixed_amount'
        ELSE type
      END
      WHERE type IN ('PERCENTAGE', 'FIXED_AMOUNT')
    `;
    console.log(`✓ Updated ${couponTypeUpdates} coupon types`);

    // Update profile visibility to lowercase
    console.log('\nUpdating profile visibility...');
    const visibilityUpdates = await prisma.$executeRaw`
      UPDATE user_privacy_settings 
      SET "profileVisibility" = CASE 
        WHEN "profileVisibility" = 'PUBLIC' THEN 'public'
        WHEN "profileVisibility" = 'PRIVATE' THEN 'private'
        WHEN "profileVisibility" = 'FRIENDS_ONLY' THEN 'friends_only'
        ELSE "profileVisibility"
      END
      WHERE "profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY')
    `;
    console.log(`✓ Updated ${visibilityUpdates} profile visibility settings`);

    console.log('\n=== Migration Complete ===');
    console.log('All enum values have been converted to lowercase.');
    console.log('Please run: npx prisma migrate dev --name update_enums_to_lowercase');
    console.log('Then run: node create-admin-user.js');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToLowercase();
