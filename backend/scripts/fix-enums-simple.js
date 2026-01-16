/**
 * Fix Enums Simple Script
 * 
 * This script fixes enum types by recreating them with lowercase values
 * 
 * Usage: node scripts/fix-enums-simple.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEnumsSimple() {
  console.log('=== FIXING ENUMS TO LOWERCASE ===\n');

  try {
    // Recreate UserRole enum
    console.log('Recreating UserRole enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME TO "UserRole_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate')`);
    console.log('✓ Recreated UserRole enum\n');
    
    // Recreate UserStatus enum
    console.log('Recreating UserStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "UserStatus" RENAME TO "UserStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending')`);
    console.log('✓ Recreated UserStatus enum\n');
    
    // Recreate Division enum
    console.log('Recreating Division enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Division" RENAME TO "Division_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh')`);
    console.log('✓ Recreated Division enum\n');
    
    // Recreate AddressType enum
    console.log('Recreating AddressType enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "AddressType" RENAME TO "AddressType_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing')`);
    console.log('✓ Recreated AddressType enum\n');
    
    // Recreate ProductStatus enum
    console.log('Recreating ProductStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued')`);
    console.log('✓ Recreated ProductStatus enum\n');
    
    // Recreate OrderStatus enum
    console.log('Recreating OrderStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
    console.log('✓ Recreated OrderStatus enum\n');
    
    // Recreate PaymentMethod enum
    console.log('Recreating PaymentMethod enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'bkash', 'nagad', 'rocket')`);
    console.log('✓ Recreated PaymentMethod enum\n');
    
    // Recreate PaymentStatus enum
    console.log('Recreating PaymentStatus enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')`);
    console.log('✓ Recreated PaymentStatus enum\n');
    
    // Recreate SocialProvider enum
    console.log('Recreating SocialProvider enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "SocialProvider" RENAME TO "SocialProvider_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook')`);
    console.log('✓ Recreated SocialProvider enum\n');
    
    // Recreate CouponType enum
    console.log('Recreating CouponType enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "CouponType" RENAME TO "CouponType_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount')`);
    console.log('✓ Recreated CouponType enum\n');
    
    // Recreate ProfileVisibility enum
    console.log('Recreating ProfileVisibility enum...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "ProfileVisibility" RENAME TO "ProfileVisibility_old"`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await prisma.$executeRawUnsafe(`CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only')`);
    console.log('✓ Recreated ProfileVisibility enum\n');
    
    console.log('\n✅ SUCCESS: All enums have been recreated with lowercase values');
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

fixEnumsSimple();
