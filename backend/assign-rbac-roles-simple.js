/**
 * Assign RBAC Roles to Test Users (Simplified)
 * 
 * This script assigns ADMIN and SUPER_ADMIN roles to test users
 * using individual Prisma queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Assigning RBAC Roles to Test Users                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Get role IDs
    const roles = await prisma.$queryRaw`
      SELECT id, name FROM roles WHERE name IN ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN')
    `;
    
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });
    
    console.log('✓ Found RBAC roles:');
    console.log('─'.repeat(70));
    console.log(`CUSTOMER: ${roleMap['CUSTOMER']}`);
    console.log(`ADMIN: ${roleMap['ADMIN']}`);
    console.log(`SUPER_ADMIN: ${roleMap['SUPER_ADMIN']}`);
    console.log('─'.repeat(70));

    // Get test users
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'test.'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('\n✓ Found test users:');
    console.log('─'.repeat(70));
    users.forEach(user => {
      console.log(`${user.email} (${user.id})`);
    });
    console.log('─'.repeat(70));

    // Assign roles to users
    for (const user of users) {
      let roleName = 'CUSTOMER';
      
      if (user.email.includes('superadmin')) {
        roleName = 'SUPER_ADMIN';
      } else if (user.email.includes('admin')) {
        roleName = 'ADMIN';
      }
      
      const roleId = roleMap[roleName];
      
      // Delete existing role assignments for this user
      await prisma.$queryRaw`
        DELETE FROM user_roles WHERE user_id = ${user.id}::text
      `;
      
      // Assign new role
      await prisma.$queryRaw`
        INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
        VALUES (${user.id}::text, ${roleId}::uuid, 'system', NOW(), true)
      `;
      
      console.log(`✓ Assigned ${roleName} role to ${user.email}`);
    }

    // Verify assignments
    console.log('\n=== Verifying Role Assignments ===');
    const assignedUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u."firstName" as first_name,
        u."lastName" as last_name,
        u.role as legacy_role,
        r.name as rbac_role,
        r.hierarchy_level,
        ur.is_active
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email LIKE 'test.%@smarttech.com'
      ORDER BY r.hierarchy_level DESC
    `;

    console.log('\nTest Users with RBAC Roles:');
    console.log('─'.repeat(100));
    console.log('Email'.padEnd(35) + 'Legacy Role'.padEnd(15) + 'RBAC Role'.padEnd(15) + 'Level'.padEnd(10) + 'Active');
    console.log('─'.repeat(100));
    
    assignedUsers.forEach(user => {
      console.log(
        user.email.padEnd(35) +
        user.legacy_role.padEnd(15) +
        (user.rbac_role || 'N/A').padEnd(15) +
        (user.hierarchy_level || 'N/A').toString().padEnd(10) +
        (user.is_active ? '✓' : '✗')
      );
    });
    console.log('─'.repeat(100));

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  RBAC Roles Assigned Successfully!                             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('Test users now have elevated roles:');
    console.log('─'.repeat(70));
    console.log('test.customer@smarttech.com    -> CUSTOMER (Level 20)');
    console.log('test.admin@smarttech.com       -> ADMIN (Level 80)');
    console.log('test.superadmin@smarttech.com  -> SUPER_ADMIN (Level 100)');
    console.log('─'.repeat(70));

    console.log('\n✓ All test users are ready for RBAC testing!');
    console.log('\nYou can now run RBAC test suites:');
    console.log('  - node rbac-backend-api.test.js');
    console.log('  - node rbac-integration-security.test.js');
    console.log('  - node rbac-comprehensive-verification.test.js');

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
