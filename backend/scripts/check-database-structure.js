/**
 * Check Database Structure
 * 
 * This script checks the actual structure of the database tables
 * to understand what columns exist and what their types are
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  console.log('=== CHECKING DATABASE STRUCTURE ===\n');

  try {
    // Check users table structure
    console.log('Users table structure:');
    const usersColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    console.table(usersColumns);
    
    // Check if role column exists
    const roleColumn = usersColumns.find(col => col.column_name === 'role');
    if (roleColumn) {
      console.log(`\n✓ Role column exists: ${roleColumn.column_name} (${roleColumn.udt_name})`);
    } else {
      console.log('\n✗ Role column does NOT exist in users table');
    }
    
    // Check if status column exists
    const statusColumn = usersColumns.find(col => col.column_name === 'status');
    if (statusColumn) {
      console.log(`✓ Status column exists: ${statusColumn.column_name} (${statusColumn.udt_name})`);
    } else {
      console.log('✗ Status column does NOT exist in users table');
    }
    
    // Check accountStatus column
    const accountStatusColumn = usersColumns.find(col => col.column_name === 'accountStatus');
    if (accountStatusColumn) {
      console.log(`✓ AccountStatus column exists: ${accountStatusColumn.column_name} (${accountStatusColumn.udt_name})`);
    } else {
      console.log('✗ AccountStatus column does NOT exist in users table');
    }
    
    // Check addresses table structure
    console.log('\n\nAddresses table structure:');
    const addressesColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `;
    console.table(addressesColumns);
    
    // Check products table structure
    console.log('\n\nProducts table structure:');
    const productsColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `;
    console.table(productsColumns);
    
    // Check orders table structure
    console.log('\n\nOrders table structure:');
    const ordersColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    console.table(ordersColumns);
    
    // Check user_privacy_settings table structure
    console.log('\n\nUser Privacy Settings table structure:');
    const privacyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_privacy_settings' 
      ORDER BY ordinal_position
    `;
    console.table(privacyColumns);
    
    // Check user_social_accounts table structure
    console.log('\n\nUser Social Accounts table structure:');
    const socialColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_social_accounts' 
      ORDER BY ordinal_position
    `;
    console.table(socialColumns);
    
    // Check coupons table structure
    console.log('\n\nCoupons table structure:');
    const couponColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'coupons' 
      ORDER BY ordinal_position
    `;
    console.table(couponColumns);
    
    // Check transactions table structure
    console.log('\n\nTransactions table structure:');
    const transactionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `;
    console.table(transactionColumns);
    
    console.log('\n\n=== DATABASE STRUCTURE CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Error checking database structure:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();
