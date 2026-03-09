/**
 * Script to check roles and user roles
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  console.log('Checking roles and user roles...\n');
  
  try {
    // Check all roles
    const roles = await prisma.$queryRaw`
      SELECT id, name, hierarchy_level FROM roles ORDER BY name
    `;
    console.log('=== ALL ROLES ===');
    for (const role of roles) {
      console.log(`  ${role.name} (id: ${role.id}, level: ${role.hierarchy_level})`);
    }
    
    // Check all user roles
    const userRoles = await prisma.$queryRaw`
      SELECT ur.user_id, ur.role_id, ur.is_active, r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
    `;
    console.log('\n=== ALL USER ROLES ===');
    for (const ur of userRoles) {
      console.log(`  user_id: ${ur.user_id}, role: ${ur.role_name}, active: ${ur.is_active}`);
    }
    
    // Check what roles the test user has
    const testUserRoles = await prisma.$queryRaw`
      SELECT ur.user_id, r.name as role_name, r.hierarchy_level
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = 'test-superadmin-001'
    `;
    console.log('\n=== TEST USER ROLES ===');
    for (const ur of testUserRoles) {
      console.log('  user_id: ' + ur.user_id + ', role: ' + ur.role_name + ', level: ' + ur.hierarchy_level);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
