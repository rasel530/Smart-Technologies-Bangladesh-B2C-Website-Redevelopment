/**
 * Execute RBAC Role Assignment SQL Script
 * 
 * This script executes the SQL script to assign RBAC roles to test users
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing SQL file: ${filePath}`);
    
    await prisma.$executeRawUnsafe(sql);
    console.log('✓ SQL executed successfully');
  } catch (error) {
    console.error('✗ Error executing SQL:', error.message);
    throw error;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Assigning RBAC Roles to Test Users                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    const sqlFilePath = path.join(__dirname, 'migrations', 'assign_rbac_roles_to_test_users.sql');
    await executeSQLFile(sqlFilePath);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  RBAC Roles Assigned Successfully!                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('Test users now have elevated roles:');
    console.log('─'.repeat(70));
    console.log('test.customer@smarttech.com    -> CUSTOMER (Level 20)');
    console.log('test.admin@smarttech.com       -> ADMIN (Level 80)');
    console.log('test.superadmin@smarttech.com  -> SUPER_ADMIN (Level 100)');
    console.log('─'.repeat(70));

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
