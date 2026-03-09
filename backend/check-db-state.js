/**
 * Script to check database state for RBAC
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('Checking database state...\n');
  
  try {
    // Check all permissions
    console.log('=== ALL PERMISSIONS ===');
    const permissions = await prisma.$queryRaw`
      SELECT id, name, resource, action FROM permissions
    `;
    console.log(JSON.stringify(permissions, null, 2));
    
    // Check all roles
    console.log('\n=== ALL ROLES ===');
    const roles = await prisma.$queryRaw`
      SELECT id, name, hierarchy_level FROM roles
    `;
    console.log(JSON.stringify(roles, null, 2));
    
    // Check role_permissions
    console.log('\n=== ROLE PERMISSIONS ===');
    const rolePerms = await prisma.$queryRaw`
      SELECT rp.role_id, rp.permission_id, r.name as role_name, p.name as permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
    `;
    console.log(JSON.stringify(rolePerms, null, 2));
    
    // Check checkout permissions specifically
    console.log('\n=== CHECKOUT PERMISSIONS ===');
    const checkoutPerms = await prisma.$queryRaw`
      SELECT id, name, resource, action FROM permissions WHERE name LIKE 'checkout:%'
    `;
    console.log(JSON.stringify(checkoutPerms, null, 2));
    
    // Check user_roles
    console.log('\n=== USER ROLES (Admin roles) ===');
    const userRoles = await prisma.$queryRaw`
      SELECT ur.user_id, ur.role_id, ur.is_active, r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'super_admin')
    `;
    console.log(JSON.stringify(userRoles, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
