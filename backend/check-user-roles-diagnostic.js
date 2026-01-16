const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log('=== USER ROLES DIAGNOSTIC REPORT ===\n');

    // Check if RBAC tables exist
    console.log('1. Checking RBAC tables...');
    try {
      const rolesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM roles`;
      console.log(`   ✓ roles table exists (${rolesCount[0].count} roles)`);
    } catch (e) {
      console.log(`   ✗ roles table does not exist: ${e.message}`);
    }

    try {
      const userRolesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user_roles`;
      console.log(`   ✓ user_roles table exists (${userRolesCount[0].count} assignments)`);
    } catch (e) {
      console.log(`   ✗ user_roles table does not exist: ${e.message}`);
    }

    // Get all users
    console.log('\n2. Checking all users...');
    const users = await prisma.$queryRaw`
      SELECT
        u.id,
        u.email,
        u.role as legacy_role,
        u.status
      FROM users u
      ORDER BY u.email
    `;
    console.log(`   Total users: ${users.length}`);

    // Check user_roles for each user
    console.log('\n3. Checking user_roles assignments...');
    const userRolesData = await prisma.$queryRaw`
      SELECT
        u.id,
        u.email,
        u.role as legacy_role,
        ur.role_id,
        r.name as rbac_role,
        ur.is_active,
        ur.assigned_at
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u.email
    `;

    let usersWithRbac = 0;
    let usersWithoutRbac = 0;
    let mismatchedRoles = 0;

    console.log('\n4. User Role Analysis:');
    console.log('─'.repeat(120));
    console.log('User ID'.padEnd(40) + 'Email'.padEnd(35) + 'Legacy Role'.padEnd(15) + 'RBAC Role'.padEnd(15) + 'Status');
    console.log('─'.repeat(120));

    for (const user of userRolesData) {
      const hasRbac = !!user.rbac_role;
      if (hasRbac) usersWithRbac++;
      else usersWithoutRbac++;

      const roleMatch = user.legacy_role?.toLowerCase() === user.rbac_role?.toLowerCase();
      if (!roleMatch && user.rbac_role) mismatchedRoles++;

      const status = hasRbac
        ? (roleMatch ? '✓ OK' : '⚠ MISMATCH')
        : '✗ NO RBAC';

      console.log(
        (user.id || '').substring(0, 38).padEnd(40) +
        (user.email || '').substring(0, 33).padEnd(35) +
        (user.legacy_role || 'NULL').padEnd(15) +
        (user.rbac_role || 'NULL').padEnd(15) +
        status
      );
    }

    console.log('─'.repeat(120));
    console.log(`\nSummary:`);
    console.log(`  Total users: ${users.length}`);
    console.log(`  Users with RBAC role: ${usersWithRbac}`);
    console.log(`  Users without RBAC role: ${usersWithoutRbac}`);
    console.log(`  Users with mismatched roles: ${mismatchedRoles}`);

    // Check roles table
    console.log('\n5. Available RBAC Roles:');
    const roles = await prisma.$queryRaw`SELECT id, name, hierarchy_level FROM roles ORDER BY hierarchy_level DESC`;
    for (const role of roles) {
      console.log(`   - ${role.name} (Level: ${role.hierarchy_level})`);
    }

    console.log('\n=== END OF REPORT ===\n');

  } catch (error) {
    console.error('Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
