/**
 * Create RBAC Test Users with Elevated Roles
 * 
 * This script creates test users for RBAC testing with properly hashed passwords
 * and assigns them elevated roles (ADMIN, SUPER_ADMIN)
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// Test user credentials
const TEST_USERS = [
  {
    email: 'test.customer@smarttech.com',
    password: 'TestCustomer123!',
    firstName: 'Test',
    lastName: 'Customer',
    role: 'customer',
    rbacRole: 'CUSTOMER'
  },
  {
    email: 'test.admin@smarttech.com',
    password: 'TestAdmin123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    rbacRole: 'ADMIN'
  },
  {
    email: 'test.superadmin@smarttech.com',
    password: 'TestSuperAdmin123!',
    firstName: 'Test',
    lastName: 'SuperAdmin',
    role: 'super_admin',
    rbacRole: 'SUPER_ADMIN'
  }
];

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Create test user
 */
async function createTestUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`✓ User ${userData.email} already exists, updating...`);
      
      // Update user password
      const hashedPassword = await hashPassword(userData.password);
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      
      return existingUser.id;
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: 'active',
        accountStatus: 'active',
        emailVerified: new Date(),
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✓ Created user: ${userData.email}`);
    return user.id;
  } catch (error) {
    console.error(`✗ Error creating user ${userData.email}:`, error.message);
    throw error;
  }
}

/**
 * Assign RBAC role to user
 */
async function assignRBACRole(userId, roleName) {
  try {
    // Get role ID from RBAC roles table
    const roleResult = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = ${roleName}
    `;

    if (!roleResult || roleResult.length === 0) {
      console.error(`✗ Role ${roleName} not found in RBAC roles table`);
      return false;
    }

    const roleId = roleResult[0].id;

    // Check if user already has this role
    const existingAssignment = await prisma.$queryRaw`
      SELECT id FROM user_roles 
      WHERE user_id = ${userId}::text AND role_id = ${roleId}
    `;

    if (existingAssignment && existingAssignment.length > 0) {
      console.log(`✓ User already has role ${roleName}, reactivating...`);
      
      // Reactivate role
      await prisma.$queryRaw`
        UPDATE user_roles 
        SET is_active = true, assigned_at = NOW()
        WHERE user_id = ${userId}::text AND role_id = ${roleId}
      `;
      
      return true;
    }

    // Assign role to user
    await prisma.$queryRaw`
      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
      VALUES (${userId}::text, ${roleId}, 'system', NOW(), true)
    `;

    console.log(`✓ Assigned role ${roleName} to user`);
    return true;
  } catch (error) {
    console.error(`✗ Error assigning role ${roleName}:`, error.message);
    return false;
  }
}

/**
 * Verify user roles
 */
async function verifyUserRoles() {
  console.log('\n=== Verifying User Roles ===');
  
  const users = await prisma.$queryRaw`
    SELECT 
      u.id,
      u.email,
      u."firstName",
      u."lastName",
      u.role as legacy_role,
      r.name as rbac_role,
      r.hierarchy_level,
      ur.is_active
    FROM users u
    LEFT JOIN user_roles ur ON u.id::text = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email LIKE 'test.%@smarttech.com'
    ORDER BY r.hierarchy_level DESC
  `;

  console.log('\nTest Users:');
  console.log('─'.repeat(100));
  console.log('Email'.padEnd(35) + 'Legacy Role'.padEnd(15) + 'RBAC Role'.padEnd(15) + 'Level'.padEnd(10) + 'Active');
  console.log('─'.repeat(100));
  
  users.forEach(user => {
    console.log(
      user.email.padEnd(35) +
      user.legacy_role.padEnd(15) +
      (user.rbac_role || 'N/A').padEnd(15) +
      (user.hierarchy_level || 'N/A').toString().padEnd(10) +
      (user.is_active ? '✓' : '✗')
    );
  });
  console.log('─'.repeat(100));
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Creating RBAC Test Users with Elevated Roles                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Create each test user
    for (const userData of TEST_USERS) {
      console.log(`\nProcessing: ${userData.email}`);
      
      // Create or update user
      const userId = await createTestUser(userData);
      
      // Assign RBAC role
      await assignRBACRole(userId, userData.rbacRole);
      
      console.log(`✓ User ${userData.email} ready for testing`);
    }

    // Verify all users
    await verifyUserRoles();

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  Test Users Created Successfully!                               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('Test User Credentials:');
    console.log('─'.repeat(70));
    TEST_USERS.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.rbacRole}`);
      console.log('─'.repeat(70));
    });

    console.log('\n✓ All test users are ready for RBAC testing!');
    console.log('\nYou can now run the RBAC test suites:');
    console.log('  - node rbac-backend-api.test.js');
    console.log('  - node rbac-integration-security.test.js');
    console.log('  - node rbac-comprehensive-verification.test.js');

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
