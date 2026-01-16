const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoleNames() {
  try {
    console.log('=== CHECKING ROLE NAMES IN DATABASE ===\n');

    // Check all roles in the database
    const roles = await prisma.$queryRaw`
      SELECT id, name, description, hierarchy_level
      FROM roles
      ORDER BY hierarchy_level DESC
    `;

    console.log('All roles in database:');
    console.table(roles);

    // Check specifically for CUSTOMER (uppercase)
    const customerRoleUpper = await prisma.$queryRaw`
      SELECT id, name, description, hierarchy_level
      FROM roles
      WHERE name = 'CUSTOMER'
    `;

    console.log('\nSearching for role name = CUSTOMER (uppercase):');
    if (customerRoleUpper.length > 0) {
      console.log('✓ Found:', customerRoleUpper[0]);
    } else {
      console.log('✗ Not found');
    }

    // Check specifically for customer (lowercase)
    const customerRoleLower = await prisma.$queryRaw`
      SELECT id, name, description, hierarchy_level
      FROM roles
      WHERE name = 'customer'
    `;

    console.log('\nSearching for role name = customer (lowercase):');
    if (customerRoleLower.length > 0) {
      console.log('✓ Found:', customerRoleLower[0]);
    } else {
      console.log('✗ Not found');
    }

    // Check with case-insensitive search
    const customerRoleCaseInsensitive = await prisma.$queryRaw`
      SELECT id, name, description, hierarchy_level
      FROM roles
      WHERE LOWER(name) = 'customer'
    `;

    console.log('\nSearching for role name (case-insensitive):');
    if (customerRoleCaseInsensitive.length > 0) {
      console.log('✓ Found:', customerRoleCaseInsensitive);
    } else {
      console.log('✗ Not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoleNames();
