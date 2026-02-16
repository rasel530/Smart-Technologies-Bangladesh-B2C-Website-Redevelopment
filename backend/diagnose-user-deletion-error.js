/**
 * Diagnostic script to identify the root cause of user deletion 500 error
 * 
 * This script will:
 * 1. Find a test user to delete
 * 2. Attempt to delete the user using the same logic as the DELETE endpoint
 * 3. Capture any errors that occur
 * 4. Identify the exact root cause
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseUserDeletion() {
  console.log('========================================');
  console.log('USER DELETION ERROR DIAGNOSIS');
  console.log('========================================\n');

  try {
    // Step 1: Find a test user to delete
    console.log('[STEP 1] Finding a test user to delete...');
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: 'test' },
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!testUser) {
      console.log('[STEP 1] No test user found. Creating one...');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('TestPassword123!', 10);
      
      testUser = await prisma.user.create({
        data: {
          email: `test-user-${Date.now()}@example.com`,
          password: passwordHash,
          firstName: 'Test',
          lastName: 'User',
          status: 'active'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    }

    console.log(`[STEP 1] Found test user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Step 2: Check user's related data
    console.log('[STEP 2] Checking user\'s related data...');
    const userWithCounts = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
            user_roles: true,
            userSessions: true,
            corporate_users: true,
            accountDeletionRequests: true
          }
        }
      }
    });

    console.log('[STEP 2] User related data counts:');
    console.log(`  - Orders: ${userWithCounts._count.orders}`);
    console.log(`  - Reviews: ${userWithCounts._count.reviews}`);
    console.log(`  - Addresses: ${userWithCounts._count.addresses}`);
    console.log(`  - User Roles: ${userWithCounts._count.user_roles}`);
    console.log(`  - User Sessions: ${userWithCounts._count.userSessions}`);
    console.log(`  - Corporate Users: ${userWithCounts._count.corporate_users}`);
    console.log(`  - Account Deletion Requests: ${userWithCounts._count.AccountDeletionRequests}\n`);

    // Step 3: Check user's RBAC roles
    console.log('[STEP 3] Checking user\'s RBAC roles...');
    const userRoles = await prisma.user_roles.findMany({
      where: {
        user_id: testUser.id,
        is_active: true
      },
      include: {
        roles: true
      }
    });

    console.log(`[STEP 3] User has ${userRoles.length} active RBAC role(s):`);
    userRoles.forEach(ur => {
      console.log(`  - ${ur.roles.name} (ID: ${ur.roles.id}, Hierarchy: ${ur.roles.hierarchy_level})`);
    });
    console.log('');

    // Step 4: Test the SUPER_ADMIN check logic (the suspected bug)
    console.log('[STEP 4] Testing SUPER_ADMIN check logic (suspected bug location)...');
    console.log('[STEP 4] Attempting to access undefined "roles" variable...');
    
    try {
      // This is the buggy code from line 808 of rbacUserRoles.js
      const hasSuperAdminRole = userRoles.some(ur => {
        const role = roles.find(r => r.id === ur.role_id); // 'roles' is undefined!
        return role && role.name === 'SUPER_ADMIN';
      });
      
      console.log(`[STEP 4] ❌ BUG: Should have thrown ReferenceError but didn't`);
    } catch (error) {
      console.log(`[STEP 4] ✅ CONFIRMED BUG: ${error.name} - ${error.message}`);
      console.log(`[STEP 4] Error stack: ${error.stack}`);
    }
    console.log('');

    // Step 5: Test the correct SUPER_ADMIN check logic
    console.log('[STEP 5] Testing CORRECTED SUPER_ADMIN check logic...');
    const hasSuperAdminRoleCorrect = userRoles.some(ur => {
      return ur.roles && ur.roles.name === 'SUPER_ADMIN';
    });
    
    console.log(`[STEP 5] User has SUPER_ADMIN role: ${hasSuperAdminRoleCorrect}\n`);

    // Step 6: Attempt soft delete
    console.log('[STEP 6] Attempting soft delete...');
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          deletedAt: new Date(),
          email: `${testUser.email}_deleted_${Date.now()}`,
          status: 'INACTIVE'
        }
      });
      
      console.log(`[STEP 6] ✅ Soft delete successful\n`);
    } catch (error) {
      console.log(`[STEP 6] ❌ Soft delete failed:`);
      console.log(`  Error: ${error.name}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log('');
    }

    // Step 7: Attempt to delete user_sessions
    console.log('[STEP 7] Attempting to delete user_sessions...');
    
    try {
      const deletedSessions = await prisma.userSession.deleteMany({
        where: { userId: testUser.id }
      });
      
      console.log(`[STEP 7] ✅ Deleted ${deletedSessions.count} user session(s)\n`);
    } catch (error) {
      console.log(`[STEP 7] ❌ Delete user_sessions failed:`);
      console.log(`  Error: ${error.name}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log('');
    }

    // Step 8: Attempt to delete user_roles
    console.log('[STEP 8] Attempting to delete user_roles...');
    
    try {
      const deletedUserRoles = await prisma.user_roles.deleteMany({
        where: { user_id: testUser.id }
      });
      
      console.log(`[STEP 8] ✅ Deleted ${deletedUserRoles.count} user role(s)\n`);
    } catch (error) {
      console.log(`[STEP 8] ❌ Delete user_roles failed:`);
      console.log(`  Error: ${error.name}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log('');
    }

    // Step 9: Attempt hard delete (if soft delete worked)
    console.log('[STEP 9] Attempting hard delete...');
    
    try {
      const deletedUser = await prisma.user.delete({
        where: { id: testUser.id }
      });
      
      console.log(`[STEP 9] ✅ Hard delete successful\n`);
    } catch (error) {
      console.log(`[STEP 9] ❌ Hard delete failed:`);
      console.log(`  Error: ${error.name}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log('');
    }

    console.log('========================================');
    console.log('DIAGNOSIS COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('\n[FATAL ERROR] Diagnostic script failed:');
    console.error(`  Error: ${error.name}`);
    console.error(`  Message: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
diagnoseUserDeletion();
