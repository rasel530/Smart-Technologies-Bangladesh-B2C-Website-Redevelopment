/**
 * Check if admin users have EMI permissions
 * Run with: node check-admin-permissions-emi.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmiPermissions() {
  console.log('=== EMI PERMISSIONS CHECK ===\n');

  try {
    // Check if emi:read permission exists
    console.log('1. Checking for emi:read permission...');
    const emiReadPermission = await prisma.permission.findFirst({
      where: { name: 'emi:read' }
    });

    if (emiReadPermission) {
      console.log(`   ✓ Permission found: ${emiReadPermission.name}`);
      console.log(`     ID: ${emiReadPermission.id}`);
      console.log(`     Description: ${emiReadPermission.description || 'N/A'}`);
    } else {
      console.log('   ✗ emi:read permission NOT found!');
    }

    console.log('');

    // Check admin users and their roles
    console.log('2. Checking admin users and their roles...');
    const adminUsers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: { in: ['admin', 'super_admin'] }
          }
        }
      },
      include: {
        roles: {
          include: {
            permissions: true
          }
        }
      }
    });

    console.log(`   Found ${adminUsers.length} admin users`);

    for (const user of adminUsers) {
      console.log(`\n   User: ${user.email} (${user.name || 'No name'})`);
      console.log(`   Roles: ${user.roles.map(r => r.name).join(', ')}`);

      // Check if user has emi:read permission
      const hasEmiRead = user.roles.some(role =>
        role.permissions.some(p => p.name === 'emi:read')
      );

      if (hasEmiRead) {
        console.log(`   ✓ Has emi:read permission`);
      } else {
        console.log(`   ✗ MISSING emi:read permission!`);
      }
    }

    console.log('\n3. Checking which roles have emi:read permission...');
    const rolesWithEmiRead = await prisma.role.findMany({
      where: {
        permissions: {
          some: {
            name: 'emi:read'
          }
        }
      },
      include: {
        permissions: true
      }
    });

    console.log(`   Found ${rolesWithEmiRead.length} roles with emi:read permission`);
    rolesWithEmiRead.forEach(role => {
      console.log(`   - ${role.name} (${role.permissions.length} permissions)`);
    });

    console.log('\n=== CHECK COMPLETE ===');
    console.log('\nSUMMARY:');
    console.log(`- emi:read permission exists: ${emiReadPermission ? 'YES' : 'NO'}`);
    console.log(`- Admin users with emi:read: ${adminUsers.filter(u => u.roles.some(r => r.permissions.some(p => p.name === 'emi:read'))).length}`);
    console.log(`- Roles with emi:read: ${rolesWithEmiRead.length}`);

    if (!emiReadPermission) {
      console.log('\n⚠️  ISSUE IDENTIFIED: emi:read permission does not exist!');
      console.log('   The permission needs to be created in the database.');
    }

    if (adminUsers.length === 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED: No admin users found!');
      console.log('   At least one admin user with admin or super_admin role is needed.');
    }

    if (adminUsers.length > 0 && !adminUsers.some(u => u.roles.some(r => r.permissions.some(p => p.name === 'emi:read')))) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Admin users lack emi:read permission!');
      console.log('   Admin users need the emi:read permission to access EMI data.');
    }

  } catch (error) {
    console.error('\n❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmiPermissions();
