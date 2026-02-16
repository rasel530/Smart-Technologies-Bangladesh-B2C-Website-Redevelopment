const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function reDiagnoseUserRoles() {
  console.log('=== RE-DIAGNOSIS: USER ROLE MANAGEMENT ISSUES ===\n');
  console.log('Date:', new Date().toISOString());
  console.log('Investigating why previous fixes did not resolve the issues\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database via Prisma\n');

    // ========================================
    // TASK 1: DATABASE STATE VERIFICATION
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 1: DATABASE STATE VERIFICATION');
    console.log('='.repeat(70));

    // 1.1 Check if users exist
    console.log('\n1.1. Checking if users exist in user table\n');
    console.log('--- Users with emails: rasel.bepari@smartbd.com, mdbaki@gmail.com ---\n');

    const targetUsers = await prisma.user.findMany({
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
        role: true, // Legacy role field
        createdAt: true,
        updatedAt: true
      }
    });

    if (targetUsers.length === 0) {
      console.log('❌ NO USERS FOUND in user table with these emails');
      console.log('   This means the users do not exist in the database at all\n');
    } else {
      console.log(`✓ Found ${targetUsers.length} user(s) in user table:`);
      targetUsers.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Name: ${user.firstName} ${user.lastName}`);
        console.log(`    Status: ${user.status}`);
        console.log(`    Legacy Role Field: ${user.role || 'NULL'}`);
        console.log(`    Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // 1.2 Check user_roles table for these users
    console.log('\n1.2. Checking user_roles table for target users\n');
    
    if (targetUsers.length > 0) {
      const userIds = targetUsers.map(u => u.id);
      
      const userRoles = await prisma.user_roles.findMany({
        where: {
          user_id: {
            in: userIds
          }
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
              description: true,
              hierarchy_level: true
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });

      if (userRoles.length === 0) {
        console.log('❌ NO ROLE ASSIGNMENTS found in user_roles table for these users');
        console.log('   This explains why they might not show up if filtering is applied\n');
      } else {
        console.log(`✓ Found ${userRoles.length} role assignment(s):`);
        userRoles.forEach(ur => {
          console.log(`  - UserRoles ID: ${ur.id}`);
          console.log(`    User ID: ${ur.user_id}`);
          console.log(`    Role ID: ${ur.role_id}`);
          console.log(`    Role Name: ${ur.roles.name}`);
          console.log(`    Role Level: ${ur.roles.hierarchy_level}`);
          console.log(`    Is Active: ${ur.is_active}`);
          console.log(`    Assigned At: ${ur.assigned_at}`);
          console.log('');
        });
      }
    }

    // 1.3 Check all users count
    console.log('\n1.3. Total users in database\n');
    const totalUsers = await prisma.user.count();
    console.log(`Total users in database: ${totalUsers}`);

    // 1.4 Check active users count
    const activeUsers = await prisma.user.count({
      where: { status: 'active' }
    });
    console.log(`Active users: ${activeUsers}`);

    // 1.5 Check users with roles
    const usersWithActiveRoles = await prisma.user.count({
      where: {
        user_roles: {
          some: {
            is_active: true
          }
        }
      }
    });
    console.log(`Users with active role assignments: ${usersWithActiveRoles}`);

    // 1.6 Check users without roles
    const usersWithoutRoles = totalUsers - usersWithActiveRoles;
    console.log(`Users without role assignments: ${usersWithoutRoles}`);

    // ========================================
    // TASK 2: CHECK RECENT USER CREATIONS
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('TASK 2: CHECK RECENT USER CREATIONS');
    console.log('='.repeat(70));

    console.log('\n2.1. Last 5 users created with their role assignments\n');

    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true, // Legacy role field
        createdAt: true,
        user_roles: {
          where: { is_active: true },
          include: {
            roles: {
              select: {
                id: true,
                name: true,
                hierarchy_level: true
              }
            }
          },
          orderBy: { assigned_at: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    recentUsers.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Legacy Role Field: ${user.role || 'NULL'}`);
      console.log(`  Role Assignments: ${user.user_roles.length}`);
      user.user_roles.forEach(ur => {
        console.log(`    - ${ur.roles.name} (Level ${ur.roles.hierarchy_level})`);
      });
      console.log('');
    });

    // ========================================
    // TASK 3: CHECK MANAGER ROLE ASSIGNMENTS
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 3: CHECK MANAGER ROLE ASSIGNMENTS');
    console.log('='.repeat(70));

    console.log('\n3.1. Finding Manager role\n');

    const managerRole = await prisma.roles.findFirst({
      where: {
        OR: [
          { name: 'Manager' },
          { name: 'manager' }
        ]
      }
    });

    if (!managerRole) {
      console.log('❌ Manager role NOT FOUND in roles table');
      console.log('   This is a critical issue - the role does not exist\n');
    } else {
      console.log(`✓ Manager role found:`);
      console.log(`  ID: ${managerRole.id}`);
      console.log(`  Name: ${managerRole.name}`);
      console.log(`  Hierarchy Level: ${managerRole.hierarchy_level}`);
      console.log(`  Description: ${managerRole.description}\n`);

      console.log('\n3.2. Users assigned to Manager role\n');

      const managerAssignments = await prisma.user_roles.findMany({
        where: {
          role_id: managerRole.id,
          is_active: true
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              role: true // Legacy role field
            }
          }
        },
        orderBy: { assigned_at: 'desc' }
      });

      if (managerAssignments.length === 0) {
        console.log('❌ NO USERS assigned to Manager role');
        console.log('   This means no one has been assigned the Manager role yet\n');
      } else {
        console.log(`✓ Found ${managerAssignments.length} user(s) with Manager role:`);
        managerAssignments.forEach(ma => {
          console.log(`  - Email: ${ma.users.email}`);
          console.log(`    Name: ${ma.users.firstName} ${ma.users.lastName}`);
          console.log(`    Status: ${ma.users.status}`);
          console.log(`    Legacy Role Field: ${ma.users.role || 'NULL'}`);
          console.log(`    Assigned At: ${ma.assigned_at}`);
          console.log('');
        });
      }
    }

    // ========================================
    // TASK 4: CHECK CUSTOMER ROLE ASSIGNMENTS
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 4: CHECK CUSTOMER ROLE ASSIGNMENTS');
    console.log('='.repeat(70));

    console.log('\n4.1. Finding Customer role\n');

    const customerRole = await prisma.roles.findFirst({
      where: {
        OR: [
          { name: 'Customer' },
          { name: 'customer' }
        ]
      }
    });

    if (!customerRole) {
      console.log('❌ Customer role NOT FOUND in roles table\n');
    } else {
      console.log(`✓ Customer role found:`);
      console.log(`  ID: ${customerRole.id}`);
      console.log(`  Name: ${customerRole.name}`);
      console.log(`  Hierarchy Level: ${customerRole.hierarchy_level}\n`);

      console.log('\n4.2. Users assigned to Customer role (showing last 10)\n');

      const customerAssignments = await prisma.user_roles.findMany({
        where: {
          role_id: customerRole.id,
          is_active: true
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true // Legacy role field
            }
          }
        },
        orderBy: { assigned_at: 'desc' },
        take: 10
      });

      console.log(`✓ Found ${customerAssignments.length} user(s) with Customer role (showing last 10):`);
      customerAssignments.forEach(ca => {
        console.log(`  - Email: ${ca.users.email}`);
        console.log(`    Legacy Role Field: ${ca.users.role || 'NULL'}`);
        console.log(`    Assigned At: ${ca.assigned_at}`);
      });
      console.log('');
    }

    // ========================================
    // TASK 5: CHECK ALL ROLES
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 5: CHECK ALL ROLES');
    console.log('='.repeat(70));

    console.log('\n5.1. All roles in database\n');

    const allRoles = await prisma.roles.findMany({
      orderBy: { hierarchy_level: 'desc' }
    });

    allRoles.forEach(role => {
      console.log(`  - ID: ${role.id}`);
      console.log(`    Name: ${role.name}`);
      console.log(`    Level: ${role.hierarchy_level}`);
      console.log(`    Description: ${role.description}`);
      console.log('');
    });

    // ========================================
    // TASK 6: SIMULATE API RESPONSE
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 6: SIMULATE API RESPONSE (GET /api/rbac/users)');
    console.log('='.repeat(70));

    console.log('\n6.1. Simulating the exact query from backend route\n');

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          user_roles: {
            where: { is_active: true },
            select: {
              id: true,
              role_id: true,
              assigned_at: true,
              roles: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  hierarchy_level: true
                }
              }
            },
            orderBy: { assigned_at: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      }),
      prisma.user.count()
    ]);

    console.log(`Total users returned: ${users.length}`);
    console.log(`Total users in database: ${totalCount}\n`);

    console.log('6.2. Checking if target users are in API response\n');

    const targetUserIds = targetUsers.map(u => u.id);
    const foundInResponse = users.filter(u => targetUserIds.includes(u.id));

    if (foundInResponse.length === 0) {
      console.log('❌ Target users NOT FOUND in API response');
      console.log('   This means they are either:');
      console.log('   1. Not in the database (already checked above)');
      console.log('   2. Being filtered out by the query');
      console.log('   3. Beyond the pagination limit (skip/take)\n');
    } else {
      console.log(`✓ Found ${foundInResponse.length} target user(s) in API response:`);
      foundInResponse.forEach(user => {
        console.log(`  - Email: ${user.email}`);
        console.log(`    Has ${user.user_roles.length} role assignment(s)`);
        if (user.user_roles.length > 0) {
          user.user_roles.forEach(ur => {
            console.log(`      - ${ur.roles.name} (Level ${ur.roles.hierarchy_level})`);
          });
        }
        console.log('');
      });
    }

    console.log('6.3. Sample API response structure (first 3 users)\n');

    users.slice(0, 3).forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Legacy Role Field: ${user.role || 'NULL'}`);
      console.log(`  Roles Array: ${user.user_roles.length} item(s)`);
      user.user_roles.forEach(ur => {
        console.log(`    - ${ur.roles.name} (ID: ${ur.roles.id}, Level: ${ur.roles.hierarchy_level})`);
      });
      console.log('');
    });

    // ========================================
    // TASK 7: CHECK FOR DATA INCONSISTENCIES
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 7: CHECK FOR DATA INCONSISTENCIES');
    console.log('='.repeat(70));

    console.log('\n7.1. Users with legacy role field set but no user_roles entry\n');

    const usersWithLegacyRole = await prisma.user.findMany({
      where: {
        role: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        user_roles: {
          where: { is_active: true }
        }
      }
    });

    const inconsistentUsers = usersWithLegacyRole.filter(u => u.user_roles.length === 0);

    if (inconsistentUsers.length === 0) {
      console.log('✓ No inconsistencies found between legacy role field and user_roles\n');
    } else {
      console.log(`❌ Found ${inconsistentUsers.length} user(s) with legacy role but no user_roles entry:`);
      inconsistentUsers.forEach(user => {
        console.log(`  - Email: ${user.email}`);
        console.log(`    Legacy Role: ${user.role}`);
        console.log('');
      });
    }

    console.log('\n7.2. Users with user_roles but different legacy role field\n');

    const usersWithRoles = await prisma.user.findMany({
      where: {
        user_roles: {
          some: {
            is_active: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        user_roles: {
          where: { is_active: true },
          include: {
            roles: true
          }
        }
      }
    });

    const roleMismatchUsers = usersWithRoles.filter(u => {
      if (u.user_roles.length === 0) return false;
      const primaryRoleName = u.user_roles[0].roles.name;
      return u.role && u.role !== primaryRoleName;
    });

    if (roleMismatchUsers.length === 0) {
      console.log('✓ No role mismatches found\n');
    } else {
      console.log(`❌ Found ${roleMismatchUsers.length} user(s) with role mismatch:`);
      roleMismatchUsers.forEach(user => {
        console.log(`  - Email: ${user.email}`);
        console.log(`    Legacy Role: ${user.role}`);
        console.log(`    Actual Roles: ${user.user_roles.map(ur => ur.roles.name).join(', ')}`);
        console.log('');
      });
    }

    // ========================================
    // TASK 8: CHECK FOR PAGINATION ISSUES
    // ========================================
    console.log('='.repeat(70));
    console.log('TASK 8: CHECK FOR PAGINATION ISSUES');
    console.log('='.repeat(70));

    console.log('\n8.1. Checking if target users might be beyond first page\n');

    if (targetUsers.length > 0) {
      for (const targetUser of targetUsers) {
        // Find the position of this user when sorted by createdAt desc
        const usersBefore = await prisma.user.count({
          where: {
            createdAt: {
              gt: targetUser.createdAt
            }
          }
        });
        
        const position = usersBefore + 1;
        const page = Math.ceil(position / 20);
        
        console.log(`User: ${targetUser.email}`);
        console.log(`  Position in sorted list: ${position}`);
        console.log(`  Would appear on page: ${page} (limit: 20)`);
        console.log('');
      }
    }

    // ========================================
    // SUMMARY OF FINDINGS
    // ========================================
    console.log('='.repeat(70));
    console.log('SUMMARY OF FINDINGS');
    console.log('='.repeat(70));

    console.log('\n📊 KEY METRICS:\n');
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Active Users: ${activeUsers}`);
    console.log(`  Users with Roles: ${usersWithActiveRoles}`);
    console.log(`  Users without Roles: ${usersWithoutRoles}`);
    console.log(`  Target Users Found: ${targetUsers.length}`);
    console.log(`  Target Users with Roles: ${targetUsers.length > 0 ? userRoles.length : 0}`);

    console.log('\n🔍 POTENTIAL ISSUES IDENTIFIED:\n');

    if (targetUsers.length === 0) {
      console.log('  ❌ ISSUE 1: Target users do not exist in the database');
      console.log('     - Users rasel.bepari@smartbd.com and mdbaki@gmail.com are not in the user table');
      console.log('     - This is the PRIMARY reason they don\'t show up on the user list page');
    } else if (userRoles.length === 0) {
      console.log('  ❌ ISSUE 1: Target users exist but have no role assignments');
      console.log('     - Users are in the database but have no entries in user_roles table');
      console.log('     - This could cause them to be filtered out if the frontend filters by role');
    }

    if (!managerRole) {
      console.log('  ❌ ISSUE 2: Manager role does not exist in the roles table');
      console.log('     - Cannot assign Manager role if the role doesn\'t exist');
      console.log('     - This explains why selecting "Manager" during creation fails');
    } else if (managerAssignments && managerAssignments.length === 0) {
      console.log('  ❌ ISSUE 2: No users assigned to Manager role');
      console.log('     - Manager role exists but no one has been assigned to it');
      console.log('     - This could indicate the role assignment logic is not working');
    }

    if (inconsistentUsers.length > 0) {
      console.log('  ❌ ISSUE 3: Data inconsistencies between legacy role field and user_roles');
      console.log('     - Some users have legacy role field set but no user_roles entries');
      console.log('     - This could cause confusion in the application');
    }

    if (roleMismatchUsers.length > 0) {
      console.log('  ❌ ISSUE 4: Role mismatches between legacy field and user_roles');
      console.log('     - Some users have different values in legacy role vs actual roles');
      console.log('     - This could cause display issues');
    }

    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR during diagnosis:', error);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

reDiagnoseUserRoles();
