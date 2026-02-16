/**
 * Setup Discount Permissions Script
 * 
 * This script creates the necessary RBAC permissions for admin discount management.
 * Run this after applying the Prisma schema migration.
 * 
 * Usage: node scripts/setup-discount-permissions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDiscountPermissions() {
  console.log('Setting up discount management permissions...\n');

  try {
    // Define permissions for discount management
    const permissions = [
      // Discount read permissions
      {
        name: 'discount:read',
        description: 'View all admin discounts',
        resource: 'discount',
        action: 'read'
      },
      {
        name: 'discount:read:own',
        description: 'View discounts created by self',
        resource: 'discount',
        action: 'read:own'
      },
      // Discount write permissions
      {
        name: 'discount:write',
        description: 'Create and update admin discounts',
        resource: 'discount',
        action: 'write'
      },
      {
        name: 'discount:create',
        description: 'Create new discount codes',
        resource: 'discount',
        action: 'create'
      },
      {
        name: 'discount:update',
        description: 'Update existing discount codes',
        resource: 'discount',
        action: 'update'
      },
      // Discount delete permissions
      {
        name: 'discount:delete',
        description: 'Deactivate or delete discount codes',
        resource: 'discount',
        action: 'delete'
      },
      // Cart discount permissions
      {
        name: 'cart:discount:apply',
        description: 'Apply discounts to customer carts',
        resource: 'cart',
        action: 'discount:apply'
      },
      {
        name: 'cart:discount:remove',
        description: 'Remove discounts from customer carts',
        resource: 'cart',
        action: 'discount:remove'
      },
      {
        name: 'cart:discount:view',
        description: 'View discount information on carts',
        resource: 'cart',
        action: 'discount:view'
      },
      // Bulk operations
      {
        name: 'discount:bulk:apply',
        description: 'Apply discounts to multiple carts',
        resource: 'discount',
        action: 'bulk:apply'
      }
    ];

    // Create permissions
    let createdCount = 0;
    for (const permission of permissions) {
      try {
        const existing = await prisma.permissions.findFirst({
          where: { name: permission.name }
        });

        if (existing) {
          console.log(`✓ Permission already exists: ${permission.name}`);
        } else {
          await prisma.permissions.create({
            data: permission
          });
          console.log(`✓ Created permission: ${permission.name}`);
          createdCount++;
        }
      } catch (err) {
        console.log(`✗ Error creating permission ${permission.name}:`, err.message);
      }
    }

    console.log(`\n${createdCount} new permissions created.\n`);

    // Define role-permission mappings
    const rolePermissions = {
      'Super Admin': [
        'discount:read',
        'discount:read:own',
        'discount:write',
        'discount:create',
        'discount:update',
        'discount:delete',
        'cart:discount:apply',
        'cart:discount:remove',
        'cart:discount:view',
        'discount:bulk:apply'
      ],
      'Admin': [
        'discount:read',
        'discount:read:own',
        'discount:write',
        'discount:create',
        'discount:update',
        'cart:discount:apply',
        'cart:discount:remove',
        'cart:discount:view',
        'discount:bulk:apply'
      ],
      'Manager': [
        'discount:read',
        'discount:read:own',
        'discount:create',
        'discount:update',
        'cart:discount:apply',
        'cart:discount:view'
      ],
      'Support': [
        'discount:read',
        'cart:discount:view'
      ]
    };

    // Assign permissions to roles
    let roleAssignmentCount = 0;
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      // Find the role
      const role = await prisma.roles.findFirst({
        where: { name: roleName }
      });

      if (!role) {
        console.log(`⚠ Role not found: ${roleName}`);
        continue;
      }

      // Get permission records
      const dbPermissions = await prisma.permissions.findMany({
        where: {
          name: { in: permissionNames }
        }
      });

      if (dbPermissions.length === 0) {
        console.log(`⚠ No permissions found for role: ${roleName}`);
        continue;
      }

      // Get existing role-permissions
      const existingRolePermissions = await prisma.rolePermissions.findMany({
        where: { roleId: role.id }
      });

      const existingPermissionIds = existingRolePermissions.map(rp => rp.permissionId);

      // Add new permissions
      for (const permission of dbPermissions) {
        if (!existingPermissionIds.includes(permission.id)) {
          await prisma.rolePermissions.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          roleAssignmentCount++;
        }
      }

      console.log(`✓ Assigned permissions to role: ${roleName}`);
    }

    console.log(`\n${roleAssignmentCount} new role-permission assignments created.\n`);

    // Create a default "Discount Manager" role if it doesn't exist
    const discountManagerRole = await prisma.roles.findFirst({
      where: { name: 'Discount Manager' }
    });

    if (!discountManagerRole) {
      const newRole = await prisma.roles.create({
        data: {
          name: 'Discount Manager',
          description: 'Can manage discounts and apply them to carts'
        }
      });

      // Assign all discount permissions to this role
      const discountPermissions = await prisma.permissions.findMany({
        where: {
          OR: [
            { name: { startsWith: 'discount:' } },
            { name: { startsWith: 'cart:discount:' } }
          ]
        }
      });

      for (const permission of discountPermissions) {
        if (permission && permission.id) {
          await prisma.rolePermissions.create({
            data: {
              roleId: newRole.id,
              permissionId: permission.id
            }
          });
        }
      }

      console.log('✓ Created "Discount Manager" role with all discount permissions\n');
    } else {
      console.log('✓ "Discount Manager" role already exists\n');
    }

    console.log('========================================');
    console.log('Discount permissions setup completed successfully!');
    console.log('========================================\n');

    // Summary
    console.log('Summary:');
    console.log(`- ${permissions.length} discount-related permissions`);
    console.log(`- ${Object.keys(rolePermissions).length} roles configured with discount permissions`);
    console.log(`- "Discount Manager" role available for dedicated discount management\n`);

    console.log('Next steps:');
    console.log('1. Assign users to appropriate roles');
    console.log('2. Test discount functionality with different role levels');
    console.log('3. Customize role-permission mappings as needed\n');

  } catch (error) {
    console.error('Error setting up discount permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  setupDiscountPermissions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDiscountPermissions };
