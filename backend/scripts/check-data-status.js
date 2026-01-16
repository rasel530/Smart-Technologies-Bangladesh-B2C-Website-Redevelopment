/**
 * Check Data Status Script
 * 
 * This script checks the current state of data in the database
 * to understand what values are actually present
 * 
 * Usage: node scripts/check-data-status.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataStatus() {
  console.log('=== CHECKING DATA STATUS ===\n');

  try {
    // Check users table
    console.log('Checking users table...');
    const users = await prisma.$queryRaw`
      SELECT id, email, role, status, "createdAt", "updatedAt" 
      FROM users 
      LIMIT 5
    `;
    
    console.log('\nUsers in database:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Status: ${u.status}`);
      console.log(`  Created: ${u.createdAt}`);
      console.log('  ---');
    });
    
    // Check enum types
    console.log('\n\nChecking enum types...');
    const enums = await prisma.$queryRaw`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('UserRole', 'UserStatus', 'AddressType', 'ProductStatus', 'OrderStatus', 'PaymentMethod', 'PaymentStatus', 'SocialProvider', 'CouponType', 'ProfileVisibility')
      ORDER BY t.typname, e.enumsortorder
    `;
    
    const enumMap = {};
    enums.forEach(e => {
      if (!enumMap[e.typname]) {
        enumMap[e.typname] = [];
      }
      enumMap[e.typname].push(e.enumlabel);
    });
    
    Object.keys(enumMap).forEach(enumName => {
      console.log(`\n${enumName}:`);
      enumMap[enumName].forEach(val => {
        console.log(`  - ${val}`);
      });
    });
    
    // Check for any data that doesn't match enum values
    console.log('\n\nChecking for data that doesn\'t match enum values...');
    
    const userRoles = await prisma.$queryRaw`SELECT DISTINCT role FROM users`;
    const userStatuses = await prisma.$queryRaw`SELECT DISTINCT status FROM users`;
    
    console.log('\nUser roles in database:');
    userRoles.forEach(u => {
      console.log(`  - ${u.role}`);
    });
    
    console.log('\nUser statuses in database:');
    userStatuses.forEach(u => {
      console.log(`  - ${u.status}`);
    });
    
  } catch (error) {
    console.error('\n❌ Failed to check data status:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataStatus();
