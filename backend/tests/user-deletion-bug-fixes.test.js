/**
 * User Deletion Bug Fixes Test Suite
 * 
 * This test suite verifies the bug fixes for user deletion functionality:
 * 1. Bug #1: Fixed enum value from 'INACTIVE' to 'inactive' in rbacUserRoles.js:843
 * 2. Bug #2: Added onDelete: Cascade to password_history foreign key in schema.prisma:622
 * 3. Bug #3: Fixed undefined roles variable reference in rbacUserRoles.js:806-817
 * 
 * Test Coverage:
 * - Test Case 1: Delete a Regular User
 * - Test Case 2: Attempt to Delete SUPER_ADMIN User
 * - Test Case 3: Attempt to Delete Own Account
 * - Test Case 4: Delete User with Orders
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  generateTestToken,
  createTestUser,
  createTestAdmin,
  cleanupTestData,
  makeAuthenticatedRequest,
  prisma 
} = require('./api-test-utils');

// Initialize Prisma client for testing
const testPrisma = new PrismaClient();

// Test configuration
const USER_DELETION_TEST_CONFIG = {
  BASE_URL: '/api/rbac',
  JWT_SECRET: process.env.JWT_SECRET || 'test_secret_key'
};

/**
 * Helper function to generate test token with proper structure
 */
const generateDeletionTestToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      userId: user.id,
      role: user.role || 'CUSTOMER' 
    },
    USER_DELETION_TEST_CONFIG.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Helper function to create test role
 */
const createTestRole = async (roleData = {}) => {
  return testPrisma.roles.create({
    data: {
      name: roleData.name || `TEST_ROLE_${Date.now()}`,
      description: roleData.description || 'Test role description',
      hierarchy_level: roleData.hierarchy_level || 10
    }
  });
};

/**
 * Helper function to create super admin user
 */
const createTestSuperAdmin = async (adminData = {}) => {
  const hashedPassword = await bcrypt.hash(
    adminData.password || 'Admin123456!', 
    10
  );

  const user = await testPrisma.user.create({
    data: {
      email: adminData.email || `super-admin-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: adminData.firstName || 'Super',
      lastName: adminData.lastName || 'Admin',
      phone: adminData.phone || '+8801987654321',
      role: 'ADMIN',
      status: 'active'
    }
  });

  // Create SUPER_ADMIN role
  const superAdminRole = await testPrisma.roles.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });

  if (superAdminRole) {
    await testPrisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: superAdminRole.id,
        assigned_by: user.id,
        is_active: true
      }
    });
  }

  const token = generateDeletionTestToken(user);
  return { user, token };
};

/**
 * Helper function to create test user with RBAC roles
 */
const createTestUserWithRBAC = async (userData = {}) => {
  const hashedPassword = await bcrypt.hash(
    userData.password || 'Test123456!', 
    10
  );

  const user = await testPrisma.user.create({
    data: {
      email: userData.email || `rbac-test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      phone: userData.phone || '+8801234567890',
      role: 'CUSTOMER',
      status: 'active'
    }
  });

  // Add password history
  await testPrisma.passwordHistory.create({
    data: {
      userId: user.id,
      passwordHash: hashedPassword
    }
  });

  // Create user session
  await testPrisma.userSession.create({
    data: {
      userId: user.id,
      token: 'test-session-token',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    }
  });

  const token = generateDeletionTestToken(user);
  return { user, token };
};

/**
 * Helper function to assign role to user
 */
const assignRoleToUser = async (userId, roleId, assignedBy) => {
  return testPrisma.user_roles.create({
    data: {
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      is_active: true
    }
  });
};

/**
 * Helper function to create test order for user
 */
const createTestOrder = async (userId) => {
  // Create test address
  const address = await testPrisma.address.create({
    data: {
      userId,
      type: 'shipping',
      firstName: 'Test',
      lastName: 'User',
      phone: '+8801234567890',
      address: 'Test Address',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'dhaka',
      postalCode: '1000'
    }
  });

  // Create test order
  const order = await testPrisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      userId,
      addressId: address.id,
      subtotal: 1000,
      tax: 0,
      shippingCost: 100,
      discount: 0,
      total: 1100,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      status: 'pending'
    }
  });

  return order;
};

/**
 * Helper function to clean up user deletion test data
 */
const cleanupUserDeletionTestData = async () => {
  await testPrisma.orderItem.deleteMany({});
  await testPrisma.order.deleteMany({});
  await testPrisma.address.deleteMany({});
  await testPrisma.userSession.deleteMany({});
  await testPrisma.passwordHistory.deleteMany({});
  await testPrisma.user_roles.deleteMany({});
  await testPrisma.user.deleteMany({
    where: { email: { contains: 'deletion-test' } }
  });
};

describe('User Deletion Bug Fixes Test Suite', () => {
  let superAdmin, adminUser, regularUser, testRole;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupUserDeletionTestData();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupUserDeletionTestData();
    
    // Create test users
    superAdmin = await createTestSuperAdmin();
    adminUser = await createTestUserWithRBAC({ email: `admin-deletion-${Date.now()}@example.com` });
    regularUser = await createTestUserWithRBAC({ email: `user-deletion-${Date.now()}@example.com` });
    
    // Create test role
    testRole = await createTestRole();
    
    // Assign role to admin user
    await assignRoleToUser(adminUser.user.id, testRole.id, superAdmin.user.id);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupUserDeletionTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupUserDeletionTestData();
    await testPrisma.$disconnect();
  });

  /**
   * ============================================================================
   * TEST CASE 1: Delete a Regular User
   * ============================================================================
   */
  describe('Test Case 1: Delete a Regular User', () => {
    describe('Success Scenarios', () => {
      it('should successfully delete a regular user without SUPER_ADMIN role', async () => {
        // Verify user exists before deletion
        let user = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');

        // Verify related data exists
        const passwordHistoryBefore = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryBefore.length).toBeGreaterThan(0);

        const userSessionsBefore = await testPrisma.userSession.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(userSessionsBefore.length).toBeGreaterThan(0);

        const userRolesBefore = await testPrisma.user_roles.findMany({
          where: { user_id: regularUser.user.id }
        });
        expect(userRolesBefore.length).toBeGreaterThan(0);

        // Delete user
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify response
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'User deleted successfully');

        // Verify user is soft deleted (not hard deleted)
        user = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('inactive');
        expect(user.deletedAt).toBeDefined();
        expect(user.email).toContain('_deleted_');

        // Verify password_history is cascade deleted
        const passwordHistoryAfter = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryAfter.length).toBe(0);

        // Verify user_sessions are deleted
        const userSessionsAfter = await testPrisma.userSession.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(userSessionsAfter.length).toBe(0);

        // Verify user_roles are deleted
        const userRolesAfter = await testPrisma.user_roles.findMany({
          where: { user_id: regularUser.user.id }
        });
        expect(userRolesAfter.length).toBe(0);
      });

      it('should return 200 with success message when user is deleted', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'User deleted successfully');
      });

      it('should not return 500 error when deleting regular user', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).not.toBe(500);
        expect(response.status).toBe(200);
      });
    });

    describe('Cascade Deletion Verification', () => {
      it('should cascade delete password_history records', async () => {
        // Create multiple password history records
        await testPrisma.passwordHistory.create({
          data: {
            userId: regularUser.user.id,
            passwordHash: 'old_password_hash_1'
          }
        });
        await testPrisma.passwordHistory.create({
          data: {
            userId: regularUser.user.id,
            passwordHash: 'old_password_hash_2'
          }
        });

        const passwordHistoryBefore = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryBefore.length).toBe(3); // 1 from setup + 2 new

        // Delete user
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify all password history records are deleted
        const passwordHistoryAfter = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryAfter.length).toBe(0);
      });

      it('should delete user_roles records', async () => {
        // Assign multiple roles
        const secondRole = await createTestRole({ name: `ROLE_2_${Date.now()}` });
        await assignRoleToUser(regularUser.user.id, secondRole.id, superAdmin.user.id);

        const userRolesBefore = await testPrisma.user_roles.findMany({
          where: { user_id: regularUser.user.id }
        });
        expect(userRolesBefore.length).toBeGreaterThan(0);

        // Delete user
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify all user_roles are deleted
        const userRolesAfter = await testPrisma.user_roles.findMany({
          where: { user_id: regularUser.user.id }
        });
        expect(userRolesAfter.length).toBe(0);
      });

      it('should delete user_sessions records', async () => {
        // Create multiple sessions
        await testPrisma.userSession.create({
          data: {
            userId: regularUser.user.id,
            token: 'test-session-token-2',
            expiresAt: new Date(Date.now() + 3600000)
          }
        });

        const userSessionsBefore = await testPrisma.userSession.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(userSessionsBefore.length).toBe(2);

        // Delete user
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify all sessions are deleted
        const userSessionsAfter = await testPrisma.userSession.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(userSessionsAfter.length).toBe(0);
      });
    });
  });

  /**
   * ============================================================================
   * TEST CASE 2: Attempt to Delete SUPER_ADMIN User
   * ============================================================================
   */
  describe('Test Case 2: Attempt to Delete SUPER_ADMIN User', () => {
    describe('Error Handling', () => {
      it('should return 403 Forbidden when trying to delete SUPER_ADMIN user', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Access denied');
        expect(response.body).toHaveProperty('message', 'Cannot delete users with SUPER_ADMIN role');
      });

      it('should not delete SUPER_ADMIN user when 403 error is returned', async () => {
        // Verify user exists before attempt
        let user = await testPrisma.user.findUnique({
          where: { id: superAdmin.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');

        // Attempt to delete
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          superAdmin.token
        );

        // Verify user is NOT deleted
        user = await testPrisma.user.findUnique({
          where: { id: superAdmin.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');
        expect(user.deletedAt).toBeNull();
      });

      it('should return correct error message for SUPER_ADMIN deletion attempt', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.body.message).toBe('Cannot delete users with SUPER_ADMIN role');
      });

      it('should prevent other admins from deleting SUPER_ADMIN users', async () => {
        // Create another admin user
        const anotherAdmin = await createTestUserWithRBAC({ 
          email: `another-admin-${Date.now()}@example.com` 
        });
        await assignRoleToUser(anotherAdmin.user.id, testRole.id, superAdmin.user.id);

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          anotherAdmin.token
        );

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Cannot delete users with SUPER_ADMIN role');
      });
    });

    describe('Edge Cases', () => {
      it('should correctly identify SUPER_ADMIN role even with multiple roles', async () => {
        // Create user with multiple roles including SUPER_ADMIN
        const multiRoleUser = await createTestUserWithRBAC({
          email: `multi-role-${Date.now()}@example.com`
        });
        
        const superAdminRole = await testPrisma.roles.findFirst({
          where: { name: 'SUPER_ADMIN' }
        });
        
        await assignRoleToUser(multiRoleUser.user.id, testRole.id, superAdmin.user.id);
        await assignRoleToUser(multiRoleUser.user.id, superAdminRole.id, superAdmin.user.id);

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${multiRoleUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Cannot delete users with SUPER_ADMIN role');
      });
    });
  });

  /**
   * ============================================================================
   * TEST CASE 3: Attempt to Delete Own Account
   * ============================================================================
   */
  describe('Test Case 3: Attempt to Delete Own Account', () => {
    describe('Error Handling', () => {
      it('should return 400 Bad Request when trying to delete own account', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${adminUser.user.id}`,
          {},
          adminUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid operation');
        expect(response.body).toHaveProperty('message', 'You cannot delete your own account');
      });

      it('should not delete user when attempting to delete own account', async () => {
        // Verify user exists before attempt
        let user = await testPrisma.user.findUnique({
          where: { id: adminUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');

        // Attempt to delete own account
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${adminUser.user.id}`,
          {},
          adminUser.token
        );

        // Verify user is NOT deleted
        user = await testPrisma.user.findUnique({
          where: { id: adminUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');
        expect(user.deletedAt).toBeNull();
      });

      it('should return correct error message for own account deletion attempt', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${adminUser.user.id}`,
          {},
          adminUser.token
        );

        expect(response.body.message).toBe('You cannot delete your own account');
      });

      it('should prevent SUPER_ADMIN from deleting their own account', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('You cannot delete your own account');
      });
    });

    describe('Edge Cases', () => {
      it('should correctly identify own account even with different role assignments', async () => {
        // Assign admin role to user
        await assignRoleToUser(regularUser.user.id, testRole.id, superAdmin.user.id);

        // Try to delete own account
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          regularUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('You cannot delete your own account');
      });
    });
  });

  /**
   * ============================================================================
   * TEST CASE 4: Delete User with Orders
   * ============================================================================
   */
  describe('Test Case 4: Delete User with Orders', () => {
    describe('Error Handling', () => {
      beforeEach(async () => {
        // Create order for regular user
        await createTestOrder(regularUser.user.id);
      });

      it('should return 400 Bad Request when trying to delete user with orders', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Cannot delete user with existing orders');
        expect(response.body).toHaveProperty('message', 'This user has existing orders and cannot be deleted');
      });

      it('should not delete user when they have existing orders', async () => {
        // Verify user exists before attempt
        let user = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');

        // Verify orders exist
        const ordersBefore = await testPrisma.order.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(ordersBefore.length).toBeGreaterThan(0);

        // Attempt to delete
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify user is NOT deleted
        user = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id }
        });
        expect(user).toBeDefined();
        expect(user.status).toBe('active');
        expect(user.deletedAt).toBeNull();

        // Verify orders still exist
        const ordersAfter = await testPrisma.order.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(ordersAfter.length).toBe(ordersBefore.length);
      });

      it('should return correct error message with suggestion for user with orders', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.body.message).toBe('This user has existing orders and cannot be deleted');
        expect(response.body).toHaveProperty('suggestion', 'Consider deactivating the user instead');
      });

      it('should return 400 even for SUPER_ADMIN trying to delete user with orders', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(400);
      });
    });

    describe('Edge Cases', () => {
      it('should correctly count orders including cancelled and refunded orders', async () => {
        // Create multiple orders with different statuses
        await createTestOrder(regularUser.user.id);
        const order = await createTestOrder(regularUser.user.id);
        
        await testPrisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' }
        });

        const userWithOrders = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id },
          include: { _count: { select: { orders: true } } }
        });

        expect(userWithOrders._count.orders).toBeGreaterThan(0);

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(400);
      });

      it('should allow deletion of user with no orders', async () => {
        // Create a new user without orders
        const userWithoutOrders = await createTestUserWithRBAC({
          email: `no-orders-${Date.now()}@example.com`
        });

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${userWithoutOrders.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
      });
    });
  });

  /**
   * ============================================================================
   * Additional Tests: Bug Fix Verification
   * ============================================================================
   */
  describe('Bug Fix Verification', () => {
    describe('Bug #1: Enum Value Fix (INACTIVE -> inactive)', () => {
      it('should use lowercase "inactive" status when soft deleting user', async () => {
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        const user = await testPrisma.user.findUnique({
          where: { id: regularUser.user.id }
        });

        expect(user).toBeDefined();
        expect(user.status).toBe('inactive'); // Should be lowercase, not 'INACTIVE'
      });

      it('should not cause 500 error due to enum value mismatch', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).not.toBe(500);
        expect(response.status).toBe(200);
      });
    });

    describe('Bug #2: Cascade Delete on password_history', () => {
      it('should cascade delete password_history when user is deleted', async () => {
        // Create multiple password history records
        await testPrisma.passwordHistory.create({
          data: {
            userId: regularUser.user.id,
            passwordHash: 'hash1'
          }
        });
        await testPrisma.passwordHistory.create({
          data: {
            userId: regularUser.user.id,
            passwordHash: 'hash2'
          }
        });
        await testPrisma.passwordHistory.create({
          data: {
            userId: regularUser.user.id,
            passwordHash: 'hash3'
          }
        });

        const passwordHistoryBefore = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryBefore.length).toBe(4); // 1 from setup + 3 new

        // Delete user
        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        // Verify cascade delete worked
        const passwordHistoryAfter = await testPrisma.passwordHistory.findMany({
          where: { userId: regularUser.user.id }
        });
        expect(passwordHistoryAfter.length).toBe(0);
      });

      it('should not cause foreign key constraint error when deleting user', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).not.toBe(500);
        expect(response.status).toBe(200);
      });
    });

    describe('Bug #3: Undefined roles variable fix', () => {
      it('should correctly check for SUPER_ADMIN role without undefined error', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${superAdmin.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Cannot delete users with SUPER_ADMIN role');
      });

      it('should not cause 500 error when checking user roles', async () => {
        // Create user with roles
        await assignRoleToUser(regularUser.user.id, testRole.id, superAdmin.user.id);

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).not.toBe(500);
        expect(response.status).toBe(200);
      });

      it('should handle user without any roles gracefully', async () => {
        // Create user without roles
        const userWithoutRoles = await createTestUserWithRBAC({
          email: `no-roles-${Date.now()}@example.com`
        });

        // Remove all roles
        await testPrisma.user_roles.deleteMany({
          where: { user_id: userWithoutRoles.user.id }
        });

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${userWithoutRoles.user.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).not.toBe(500);
        expect(response.status).toBe(200);
      });
    });
  });

  /**
   * ============================================================================
   * Integration Tests
   * ============================================================================
   */
  describe('Integration Tests', () => {
    it('should handle complete user deletion workflow', async () => {
      // 1. Create user with roles, password history, and sessions
      const testUser = await createTestUserWithRBAC({
        email: `workflow-${Date.now()}@example.com`
      });
      await assignRoleToUser(testUser.user.id, testRole.id, superAdmin.user.id);

      // 2. Verify all data exists
      let user = await testPrisma.user.findUnique({
        where: { id: testUser.user.id },
        include: { _count: { select: { orders: true } } }
      });
      expect(user).toBeDefined();
      expect(user._count.orders).toBe(0);

      const passwordHistory = await testPrisma.passwordHistory.findMany({
        where: { userId: testUser.user.id }
      });
      expect(passwordHistory.length).toBeGreaterThan(0);

      const userRoles = await testPrisma.user_roles.findMany({
        where: { user_id: testUser.user.id }
      });
      expect(userRoles.length).toBeGreaterThan(0);

      const userSessions = await testPrisma.userSession.findMany({
        where: { userId: testUser.user.id }
      });
      expect(userSessions.length).toBeGreaterThan(0);

      // 3. Delete user
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${testUser.user.id}`,
        {},
        superAdmin.token
      );

      expect(response.status).toBe(200);

      // 4. Verify user is soft deleted
      user = await testPrisma.user.findUnique({
        where: { id: testUser.user.id }
      });
      expect(user.status).toBe('inactive');
      expect(user.deletedAt).toBeDefined();

      // 5. Verify related data is deleted
      const passwordHistoryAfter = await testPrisma.passwordHistory.findMany({
        where: { userId: testUser.user.id }
      });
      expect(passwordHistoryAfter.length).toBe(0);

      const userRolesAfter = await testPrisma.user_roles.findMany({
        where: { user_id: testUser.user.id }
      });
      expect(userRolesAfter.length).toBe(0);

      const userSessionsAfter = await testPrisma.userSession.findMany({
        where: { userId: testUser.user.id }
      });
      expect(userSessionsAfter.length).toBe(0);
    });

    it('should prevent deletion of user with all three restrictions', async () => {
      // Create user with SUPER_ADMIN role
      const restrictedUser = await createTestUserWithRBAC({
        email: `restricted-${Date.now()}@example.com`
      });
      
      const superAdminRole = await testPrisma.roles.findFirst({
        where: { name: 'SUPER_ADMIN' }
      });
      
      await assignRoleToUser(restrictedUser.user.id, superAdminRole.id, superAdmin.user.id);

      // Try to delete - should fail due to SUPER_ADMIN role
      const response1 = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${restrictedUser.user.id}`,
        {},
        superAdmin.token
      );
      expect(response1.status).toBe(403);
      expect(response1.body.message).toBe('Cannot delete users with SUPER_ADMIN role');

      // Remove SUPER_ADMIN role and add order
      await testPrisma.user_roles.deleteMany({
        where: { user_id: restrictedUser.user.id }
      });
      await createTestOrder(restrictedUser.user.id);

      // Try to delete - should fail due to orders
      const response2 = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${restrictedUser.user.id}`,
        {},
        superAdmin.token
      );
      expect(response2.status).toBe(400);
      expect(response2.body.message).toBe('This user has existing orders and cannot be deleted');
    });
  });

  /**
   * ============================================================================
   * Security Tests
   * ============================================================================
   */
  describe('Security Tests', () => {
    it('should return 401 for unauthenticated deletion request', async () => {
      const response = await request(app)
        .delete(`${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for unauthorized user (without delete permission)', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${regularUser.user.id}`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/${fakeId}`,
        {},
        superAdmin.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `${USER_DELETION_TEST_CONFIG.BASE_URL}/users/invalid-uuid`,
        {},
        superAdmin.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });
});
