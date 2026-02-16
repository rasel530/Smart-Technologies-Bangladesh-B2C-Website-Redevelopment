/**
 * RBAC Permission Update Script
 * Adds cart audit permissions to the database
 * 
 * Run: node scripts/add-cart-audit-permissions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding cart audit permissions...\n');

  // Define permissions to add
  const permissions = [
    // Cart Notes Permissions
    {
      name: 'cart_note:create',
      displayName: 'Create Cart Notes',
      description: 'Allows admins to add notes to carts',
      resource: 'cart_note',
      action: 'create',
      category: 'Cart Management'
    },
    {
      name: 'cart_note:read',
      displayName: 'View Cart Notes',
      description: 'Allows admins to view notes on carts',
      resource: 'cart_note',
      action: 'read',
      category: 'Cart Management'
    },
    {
      name: 'cart_note:update',
      displayName: 'Edit Cart Notes',
      description: 'Allows admins to edit notes on carts',
      resource: 'cart_note',
      action: 'update',
      category: 'Cart Management'
    },
    {
      name: 'cart_note:delete',
      displayName: 'Delete Cart Notes',
      description: 'Allows admins to delete notes from carts',
      resource: 'cart_note',
      action: 'delete',
      category: 'Cart Management'
    },
    // Cart Audit Permissions
    {
      name: 'cart_audit:read',
      displayName: 'View Cart Audit Logs',
      description: 'Allows admins to view cart modification history',
      resource: 'cart_audit',
      action: 'read',
      category: 'Cart Management'
    },
    {
      name: 'cart_audit:rollback',
      displayName: 'Rollback Cart Actions',
      description: 'Allows admins to rollback cart modifications',
      resource: 'cart_audit',
      action: 'rollback',
      category: 'Cart Management'
    },
    {
      name: 'cart_audit:export',
      displayName: 'Export Cart Audit Logs',
      description: 'Allows admins to export cart audit logs',
      resource: 'cart_audit',
      action: 'export',
      category: 'Cart Management'
    }
  ];

  // Create permissions
  for (const permission of permissions) {
    try {
      const existing = await prisma.permission.findFirst({
        where: { name: permission.name }
      });

      if (existing) {
        console.log(`✓ Permission already exists: ${permission.name}`);
        continue;
      }

      const created = await prisma.permission.create({
        data: permission
      });
      console.log(`✓ Created permission: ${created.name} (ID: ${created.id})`);
    } catch (error) {
      console.error(`✗ Error creating permission ${permission.name}:`, error.message);
    }
  }

  // Get or create Admin role
  let adminRole;
  try {
    adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });
  } catch (error) {
    console.error('Error finding admin role:', error.message);
  }

  if (adminRole) {
    console.log('\nAssigning permissions to admin role...');
    
    // Get all new permissions
    const newPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: permissions.map(p => p.name)
        }
      }
    });

    // Assign permissions to admin role
    for (const permission of newPermissions) {
      try {
        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });

        if (existingRolePermission) {
          console.log(`  ✓ Permission already assigned: ${permission.name}`);
          continue;
        }

        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`  ✓ Assigned permission: ${permission.name}`);
      } catch (error) {
        console.error(`  ✗ Error assigning permission ${permission.name}:`, error.message);
      }
    }
  } else {
    console.log('\n⚠ Admin role not found. Please assign permissions manually.');
  }

  // Get or create Super Admin role
  let superAdminRole;
  try {
    superAdminRole = await prisma.role.findFirst({
      where: { name: 'super_admin' }
    });
  } catch (error) {
    console.error('Error finding super_admin role:', error.message);
  }

  if (superAdminRole) {
    console.log('\nAssigning all permissions to super_admin role...');
    
    // Get all permissions
    const allPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: permissions.map(p => p.name)
        }
      }
    });

    // Assign all permissions to super_admin
    for (const permission of allPermissions) {
      try {
        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });

        if (existingRolePermission) {
          continue;
        }

        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
      } catch (error) {
        // Ignore errors for super_admin
      }
    }
    console.log('✓ All permissions assigned to super_admin');
  }

  console.log('\n✅ RBAC permission update complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
