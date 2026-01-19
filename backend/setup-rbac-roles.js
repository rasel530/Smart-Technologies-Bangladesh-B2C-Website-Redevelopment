/**
 * Script to create RBAC roles in database
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function setupRBACRoles() {
  const prisma = new PrismaClient();
  try {
    console.log('Setting up RBAC roles...');
    const roles = [
      { name: 'CUSTOMER', description: 'Regular customer', hierarchy_level: 1 },
      { name: 'SUPPORT', description: 'Support staff', hierarchy_level: 2 },
      { name: 'MANAGER', description: 'Manager', hierarchy_level: 3 },
      { name: 'ADMIN', description: 'Administrator', hierarchy_level: 4 },
      { name: 'SUPER_ADMIN', description: 'Super administrator', hierarchy_level: 5 }
    ];
    for (const roleData of roles) {
      const existingRole = await prisma.roles.findUnique({ where: { name: roleData.name } });
      if (existingRole) {
        console.log(`Role '${roleData.name}' already exists`);
      } else {
        const role = await prisma.roles.create({ data: roleData });
        console.log(`Created role '${role.name}' (ID: ${role.id}, Level: ${role.hierarchy_level})`);
      }
    }
    const allRoles = await prisma.roles.findMany({ orderBy: { hierarchy_level: 'asc' } });
    console.log('RBAC roles setup completed!');
    for (const role of allRoles) {
      console.log(`  - ${role.name} (Level: ${role.hierarchy_level}): ${role.description}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
setupRBACRoles();