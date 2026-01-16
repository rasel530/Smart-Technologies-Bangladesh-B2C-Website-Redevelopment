/**
 * Fix UserRole table for test.admin and test.superadmin users
 * They currently have 'customer' role but should have 'admin' and 'super_admin' roles
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log('Fixing UserRole assignments for test users...\n');

  try {
    // Get role IDs directly from database
    const roles = await prisma.role.findMany({
      where: {
        role_name: {
          in: ['customer', 'admin', 'super_admin']
        }
      }
    });

    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.role_name] = r;
    });

    if (roles.length < 3) {
      console.error('ERROR: Not all required roles found in database');
      console.log('Roles found:', roles.map(r => `${r.role_name} (${r.id})`).join(', '));
      return;
    }

    console.log('Role IDs found:');
    console.log('  customer:', roleMap.customer.id, '-', roleMap.customer.role_name);
    console.log('  admin:', roleMap.admin.id, '-', roleMap.admin.role_name);
    console.log('  super_admin:', roleMap.super_admin.id, '-', roleMap.super_admin.role_name);
    console.log();

    // Get test users
    const testCustomer = await prisma.user.findUnique({
      where: { email: 'test.customer@smarttech.com' }
    });

    const testAdmin = await prisma.user.findUnique({
      where: { email: 'test.admin@smarttech.com' }
    });

    const testSuperAdmin = await prisma.user.findUnique({
      where: { email: 'test.superadmin@smarttech.com' }
    });

    console.log('Test users found:');
    console.log('  test.customer@smarttech.com:', testCustomer ? '✓' : '✗');
    console.log('  test.admin@smarttech.com:', testAdmin ? '✓' : '✗');
    console.log('  test.superadmin@smarttech.com:', testSuperAdmin ? '✓' : '✗');
    console.log();

    // Check current UserRole assignments
    console.log('Current UserRole assignments:');
    for (const user of [testCustomer, testAdmin, testSuperAdmin]) {
      if (!user) continue;

      const userRoles = await prisma.userRole.findMany({
        where: { user_id: user.id },
        include: {
          role: true
        }
      });

      console.log(`  ${user.email}:`);
      userRoles.forEach(ur => {
        console.log(`    - role_id: ${ur.role_id}, role_name: ${ur.role.role_name}`);
      });
    }
    console.log();

    // Fix test.admin role
    if (testAdmin) {
      console.log('Fixing test.admin@smarttech.com role...');

      // Remove existing customer role
      const existingRoles = await prisma.userRole.findMany({
        where: { user_id: testAdmin.id }
      });

      if (existingRoles.length > 0) {
        console.log(`  Removing ${existingRoles.length} existing role assignment(s)...`);
        await prisma.userRole.deleteMany({
          where: { user_id: testAdmin.id }
        });
      }

      // Assign admin role
      await prisma.userRole.create({
        data: {
          user_id: testAdmin.id,
          role_id: roleMap.admin.id,
          assigned_at: new Date(),
          assigned_by: 'system'
        }
      });

      console.log('  ✓ Assigned admin role to test.admin@smarttech.com');
    }

    // Fix test.superadmin role
    if (testSuperAdmin) {
      console.log('Fixing test.superadmin@smarttech.com role...');

      // Remove existing customer role
      const existingRoles = await prisma.userRole.findMany({
        where: { user_id: testSuperAdmin.id }
      });

      if (existingRoles.length > 0) {
        console.log(`  Removing ${existingRoles.length} existing role assignment(s)...`);
        await prisma.userRole.deleteMany({
          where: { user_id: testSuperAdmin.id }
        });
      }

      // Assign super_admin role
      await prisma.userRole.create({
        data: {
          user_id: testSuperAdmin.id,
          role_id: roleMap.super_admin.id,
          assigned_at: new Date(),
          assigned_by: 'system'
        }
      });

      console.log('  ✓ Assigned super_admin role to test.superadmin@smarttech.com');
    }

    // Verify fixes
    console.log('\nVerifying fixes...');
    const verifyAdmin = await prisma.userRole.findMany({
      where: { user_id: testAdmin.id },
      include: { role: true }
    });

    const verifySuperAdmin = await prisma.userRole.findMany({
      where: { user_id: testSuperAdmin.id },
      include: { role: true }
    });

    console.log('test.admin@smarttech.com roles after fix:');
    verifyAdmin.forEach(ur => {
      console.log(`  - ${ur.role_name}`);
    });

    console.log('test.superadmin@smarttech.com roles after fix:');
    verifySuperAdmin.forEach(ur => {
      console.log(`  - ${ur.role_name}`);
    });

    console.log('\n✓ UserRole fixes completed successfully!');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
