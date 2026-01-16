const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRolesTable() {
  try {
    console.log('=== CHECKING ROLES TABLE ===\n');

    // Check all roles
    const roles = await prisma.$queryRaw`
      SELECT id, name, hierarchy_level
      FROM roles
      ORDER BY hierarchy_level DESC
    `;

    console.log('Available Roles:');
    for (const role of roles) {
      console.log(`  - ${role.name} (ID: ${role.id}, Level: ${role.hierarchy_level})`);
    }

    // Check specifically for CUSTOMER role
    const customerRole = await prisma.$queryRaw`
      SELECT id, name, hierarchy_level
      FROM roles
      WHERE name = 'CUSTOMER'
      LIMIT 1
    `;

    if (customerRole.length === 0) {
      console.error('\n✗ ERROR: CUSTOMER role NOT found in roles table!');
      console.error('This is why RBAC role assignment is failing!');
    } else {
      console.log('\n✓ CUSTOMER role found:');
      console.log(`  ID: ${customerRole[0].id}`);
      console.log(`  Name: ${customerRole[0].name}`);
      console.log(`  Level: ${customerRole[0].hierarchy_level}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRolesTable();
