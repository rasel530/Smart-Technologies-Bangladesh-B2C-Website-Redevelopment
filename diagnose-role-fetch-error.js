/**
 * Diagnostic script to identify the 500 error when fetching a role
 * Role ID: c8e80340-054e-451c-a53f-104b188fe0ec
 */

const { PrismaClient } = require('@prisma/client');
const Role = require('./backend/models/Role');

const prisma = new PrismaClient();
const roleModel = new Role();

const TEST_ROLE_ID = 'c8e80340-054e-451c-a53f-104b188fe0ec';

async function diagnoseRoleFetch() {
  console.log('='.repeat(60));
  console.log('DIAGNOSING ROLE FETCH ERROR');
  console.log('='.repeat(60));
  console.log(`Role ID: ${TEST_ROLE_ID}`);
  console.log('');

  try {
    // Test 1: Check database connection
    console.log('TEST 1: Database Connection');
    console.log('-'.repeat(60));
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    console.log('');

    // Test 2: Check if role exists
    console.log('TEST 2: Check if role exists');
    console.log('-'.repeat(60));
    const role = await prisma.roles.findFirst({
      where: { id: TEST_ROLE_ID }
    });
    console.log('Role found:', role ? 'YES' : 'NO');
    if (role) {
      console.log('Role details:', JSON.stringify(role, null, 2));
    } else {
      console.log('⚠ WARNING: Role not found in database');
    }
    console.log('');

    // Test 3: Check role_permissions table structure
    console.log('TEST 3: Check role_permissions table');
    console.log('-'.repeat(60));
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { role_id: TEST_ROLE_ID }
    });
    console.log(`Found ${rolePermissions.length} role permissions`);
    if (rolePermissions.length > 0) {
      console.log('First permission:', JSON.stringify(rolePermissions[0], null, 2));
    }
    console.log('');

    // Test 4: Test Role model findById method
    console.log('TEST 4: Test Role model findById method');
    console.log('-'.repeat(60));
    try {
      const roleById = await roleModel.findById(TEST_ROLE_ID);
      console.log('✓ findById successful');
      console.log('Result:', JSON.stringify(roleById, null, 2));
    } catch (error) {
      console.log('✗ findById FAILED');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }
    console.log('');

    // Test 5: Test Role model getPermissions method
    console.log('TEST 5: Test Role model getPermissions method');
    console.log('-'.repeat(60));
    try {
      const permissions = await roleModel.getPermissions(TEST_ROLE_ID);
      console.log('✓ getPermissions successful');
      console.log('Result:', JSON.stringify(permissions, null, 2));
    } catch (error) {
      console.log('✗ getPermissions FAILED');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }
    console.log('');

    // Test 6: Check all roles in database
    console.log('TEST 6: List all roles in database');
    console.log('-'.repeat(60));
    const allRoles = await prisma.roles.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        hierarchy_level: true
      },
      orderBy: { name: 'asc' }
    });
    console.log(`Total roles: ${allRoles.length}`);
    allRoles.forEach(r => {
      console.log(`  - ${r.name} (${r.id})`);
    });
    console.log('');

    // Test 7: Check permissions table
    console.log('TEST 7: Check permissions table');
    console.log('-'.repeat(60));
    const allPermissions = await prisma.permissions.findMany({
      select: {
        id: true,
        name: true,
        resource: true,
        action: true
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });
    console.log(`Total permissions: ${allPermissions.length}`);
    allPermissions.forEach(p => {
      console.log(`  - ${p.resource}:${p.action} (${p.name})`);
    });
    console.log('');

  } catch (error) {
    console.log('FATAL ERROR:');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));
  }
}

diagnoseRoleFetch();
