/**
 * Cart Audit Permissions Setup Script
 * 
 * This script creates the necessary RBAC permissions for cart audit logging and notes.
 * Run this after applying the Prisma schema migration.
 * 
 * Usage: node scripts/setup-cart-audit-permissions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupCartAuditPermissions() {
  console.log('Setting up cart audit permissions...\n');

  try {
    // Define permissions for cart audit
    const permissions = [
      // Cart Notes Permissions
      {
        name: 'cart_note:create',
        description: 'Allows admins to add notes to carts',
        resource: 'cart_note',
        action: 'create'
      },
      {
        name: 'cart_note:read',
        description: 'Allows admins to view notes on carts',
        resource: 'cart_note',
        action: 'read'
      },
      {
        name: 'cart_note:update',
        description: 'Allows admins to edit notes on carts',
        resource: 'cart_note',
        action: 'update'
      },
      {
        name: 'cart_note:delete',
        description: 'Allows admins to delete notes from carts',
        resource: 'cart_note',
        action: 'delete'
      },
      // Cart Audit Permissions
      {
        name: 'cart_audit:read',
        description: 'Allows admins to view cart modification history',
        resource: 'cart_audit',
        action: 'read'
      },
      {
        name: 'cart_audit:rollback',
        description: 'Allows admins to rollback cart modifications',
        resource: 'cart_audit',
        action: 'rollback'
      },
      {
        name: 'cart_audit:export',
        description: 'Allows admins to export cart audit logs',
        resource: 'cart_audit',
        action: 'export'
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
        'cart_note:create',
        'cart_note:read',
        'cart_note:update',
        'cart_note:delete',
        'cart_audit:read',
        'cart_audit:rollback',
        'cart_audit:export'
      ],
      'Admin': [
        'cart_note:create',
        'cart_note:read',
        'cart_note:update',
        'cart_note:delete',
        'cart_audit:read',
        'cart_audit:rollback',
        'cart_audit:export'
      ],
      'Manager': [
        'cart_note:create',
        'cart_note:read',
        'cart_note:update',
        'cart_audit:read'
      ],
      'Support': [
        'cart_note:read',
        'cart_audit:read'
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

    console.log('========================================');
    console.log('Cart audit permissions setup completed successfully!');
    console.log('========================================\n');

    // Summary
    console.log('Summary:');
    console.log(`- ${permissions.length} cart audit-related permissions`);
    console.log(`- ${Object.keys(rolePermissions).length} roles configured with cart audit permissions\n`);

    console.log('Next steps:');
    console.log('1. Assign users to appropriate roles');
    console.log('2. Test cart audit functionality with different role levels');
    console.log('3. Customize role-permission mappings as needed\n');

  } catch (error) {
    console.error('Error setting up cart audit permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  setupCartAuditPermissions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCartAuditPermissions };
