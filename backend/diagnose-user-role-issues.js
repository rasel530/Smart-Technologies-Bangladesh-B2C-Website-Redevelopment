const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function diagnoseUserRoles() {
  console.log('=== USER ROLE MANAGEMENT ISSUES DIAGNOSIS ===\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database via Prisma\n');

    console.log('1. CHECKING DATABASE STATE FOR MISSING USERS\n');
    console.log('--- Users with emails: rasel.bepari@smartbd.com, mdbaki@gmail.com ---\n');

    // Check if users exist in users table
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['rasel.bepari@smartbd.com', 'mdbaki@gmail.com']
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ NO USERS FOUND in users table with these emails');
    } else {
      console.log(`✓ Found ${users.length} user(s) in users table:`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Status: ${user.status}`);
      });
    }

    console.log('\n--- Checking user_roles table for these users ---\n');
    
    if (users.length > 0) {
      const userIds = users.map(u => u.id);
      
      const userRoles = await prisma.$queryRaw`
        SELECT ur.*, r.name as roleName, r.hierarchy_level as roleLevel
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id IN (${userIds.join(',')})
      `;

      if (userRoles.length === 0) {
        console.log('❌ NO ROLE ASSIGNMENTS found in user_roles table for these users');
      } else {
        console.log(`✓ Found ${userRoles.length} role assignment(s):`);
        userRoles.forEach(ur => {
          console.log(`  - UserID: ${ur.user_id}, RoleID: ${ur.role_id}, Role: ${ur.roleName} (Level ${ur.roleLevel}), AssignedAt: ${ur.assigned_at}`);
        });
      }
    }

    console.log('\n2. CHECKING ALL USERS IN DATABASE\n');
    console.log('--- Total users count ---\n');
    
    const totalUsers = await prisma.user.count();
    console.log(`Total users in database: ${totalUsers}`);

    console.log('\n--- Recent users (last 10) ---\n');
    
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    recentUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Status: ${user.status}, Created: ${user.createdAt}`);
    });

    console.log('\n3. CHECKING ROLE ASSIGNMENTS FOR ALL USERS\n');
    console.log('--- Users with their roles ---\n');
    
    const usersWithRoles = await prisma.$queryRaw`
      SELECT u.id, u.email, u."firstName", u."lastName", 
             r.id as roleId, r.name as roleName, r.hierarchy_level as roleLevel
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u."createdAt" DESC
      LIMIT 15
    `;

    usersWithRoles.forEach(u => {
      const roleInfo = u.roleName ? `${u.roleName} (Level ${u.roleLevel})` : 'NO ROLE';
      console.log(`  - UserID: ${u.id}, Email: ${u.email}, Role: ${roleInfo}`);
    });

    console.log('\n4. CHECKING ROLES TABLE STRUCTURE AND DATA\n');
    console.log('--- All available roles ---\n');
    
    const roles = await prisma.$queryRaw`
      SELECT * FROM roles ORDER BY hierarchy_level
    `;
    
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, Name: ${role.name}, Level: ${role.hierarchy_level}, Description: ${role.description}`);
    });

    console.log('\n5. CHECKING FOR MANAGER ROLE ASSIGNMENTS\n');
    console.log('--- Users assigned to Manager role ---\n');
    
    const managerUsers = await prisma.$queryRaw`
      SELECT u.id, u.email, u."firstName", u."lastName", ur.assigned_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = (SELECT id FROM roles WHERE name = 'Manager' LIMIT 1)
    `;

    if (managerUsers.length === 0) {
      console.log('❌ NO USERS assigned to Manager role');
    } else {
      console.log(`✓ Found ${managerUsers.length} user(s) with Manager role:`);
      managerUsers.forEach(user => {
        console.log(`  - UserID: ${user.id}, Email: ${user.email}, AssignedAt: ${user.assigned_at}`);
      });
    }

    console.log('\n6. CHECKING FOR CUSTOMER ROLE ASSIGNMENTS\n');
    console.log('--- Users assigned to Customer role ---\n');
    
    const customerUsers = await prisma.$queryRaw`
      SELECT u.id, u.email, u."firstName", u."lastName", ur.assigned_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1)
    `;

    console.log(`✓ Found ${customerUsers.length} user(s) with Customer role (showing last 10):`);
    customerUsers.slice(0, 10).forEach(user => {
      console.log(`  - UserID: ${user.id}, Email: ${user.email}, AssignedAt: ${user.assigned_at}`);
    });

    console.log('\n=== DIAGNOSIS COMPLETE ===\n');

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseUserRoles();
