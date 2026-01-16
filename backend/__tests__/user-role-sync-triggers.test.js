/**
 * Comprehensive Test Suite for User Role Synchronization Triggers
 * 
 * This test suite verifies that the database triggers correctly synchronize
 * the legacy users.role column with the RBAC user_roles table.
 * 
 * The triggers being tested are:
 * - INSERT trigger: Updates legacy role when a new RBAC role is assigned
 * - UPDATE trigger: Updates legacy role when an RBAC role is changed
 * - DELETE trigger: Updates legacy role when an RBAC role is removed
 * 
 * @jest-environment node
 */

const { databaseService } = require('../services/database');
const bcrypt = require('bcryptjs');

// Test configuration
const TEST_TIMEOUT = 30000;

/**
 * Helper function to create a test user
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@smarttech.com`,
    phone: `+8801${Math.floor(Math.random() * 1000000000)}`,
    password: await bcrypt.hash('TestPassword123!', 10),
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    status: 'active',
    emailVerified: new Date(),
    phoneVerified: new Date()
  };

  const mergedData = { ...defaultData, ...userData };

  const result = await databaseService.prisma.$queryRaw`
    INSERT INTO users (id, email, phone, password, "firstName", "lastName", role, status, "emailVerified", "phoneVerified", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${mergedData.email},
      ${mergedData.phone},
      ${mergedData.password},
      ${mergedData.firstName},
      ${mergedData.lastName},
      ${mergedData.role}::"UserRole",
      ${mergedData.status}::"UserStatus",
      ${mergedData.emailVerified},
      ${mergedData.phoneVerified},
      NOW(),
      NOW()
    )
    RETURNING id, email, phone, role
  `;

  return result[0];
}

/**
 * Helper function to get a user's legacy role
 * @param {string} userId - User ID
 * @returns {Promise<string>} User's legacy role
 */
async function getUserLegacyRole(userId) {
  const result = await databaseService.prisma.$queryRaw`
    SELECT role FROM users WHERE id = ${userId}
  `;
  return result[0]?.role;
}

/**
 * Helper function to get a user's RBAC roles
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's RBAC roles
 */
async function getUserRBACRoles(userId) {
  const result = await databaseService.prisma.$queryRaw`
    SELECT 
      r.id,
      r.name,
      r.hierarchy_level,
      ur.is_active,
      ur.expires_at
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${userId}
    ORDER BY r.hierarchy_level DESC
  `;
  return result;
}

/**
 * Helper function to assign an RBAC role to a user
 * @param {string} userId - User ID
 * @param {string} roleName - Role name
 * @returns {Promise<Object>} Assigned role
 */
async function assignRBACRole(userId, roleName) {
  const result = await databaseService.prisma.$queryRaw`
    INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
    VALUES (
      ${userId},
      (SELECT id FROM roles WHERE name = ${roleName}),
      NOW(),
      true
    )
    RETURNING *
  `;
  return result[0];
}

/**
 * Helper function to update a user's RBAC role
 * @param {string} userId - User ID
 * @param {string} oldRoleName - Current role name
 * @param {string} newRoleName - New role name
 * @returns {Promise<Object>} Updated role assignment
 */
async function updateRBACRole(userId, oldRoleName, newRoleName) {
  const result = await databaseService.prisma.$queryRaw`
    UPDATE user_roles
    SET role_id = (SELECT id FROM roles WHERE name = ${newRoleName})
    WHERE user_id = ${userId}
      AND role_id = (SELECT id FROM roles WHERE name = ${oldRoleName})
    RETURNING *
  `;
  return result[0];
}

/**
 * Helper function to remove an RBAC role from a user
 * @param {string} userId - User ID
 * @param {string} roleName - Role name to remove
 * @returns {Promise<Object>} Removed role assignment
 */
async function removeRBACRole(userId, roleName) {
  const result = await databaseService.prisma.$queryRaw`
    DELETE FROM user_roles
    WHERE user_id = ${userId}
      AND role_id = (SELECT id FROM roles WHERE name = ${roleName})
    RETURNING *
  `;
  return result[0];
}

/**
 * Helper function to delete a test user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteTestUser(userId) {
  await databaseService.prisma.$queryRaw`
    DELETE FROM user_roles WHERE user_id = ${userId}
  `;
  await databaseService.prisma.$queryRaw`
    DELETE FROM users WHERE id = ${userId}
  `;
}

// Store test user IDs for cleanup
const testUserIds = [];

describe('User Role Synchronization Triggers', () => {
  let dbConnected = false;

  beforeAll(async () => {
    try {
      await databaseService.connect();
      dbConnected = true;
      console.log('✅ Database connected for testing');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (dbConnected) {
      // Clean up all test users
      console.log('🧹 Cleaning up test users...');
      for (const userId of testUserIds) {
        try {
          await deleteTestUser(userId);
        } catch (error) {
          console.warn(`⚠️ Failed to delete test user ${userId}:`, error.message);
        }
      }
      
      await databaseService.disconnect();
      console.log('✅ Database disconnected');
    }
  });

  /**
   * Test Suite 1: Verify Original Users Have Correct Roles
   * 
   * This test verifies that the two original users now have correct legacy roles
   * after the one-time sync was executed.
   */
  describe('1. Original Users Role Verification', () => {
    it('should verify test.admin@smarttech.com has admin role', async () => {
      const result = await databaseService.prisma.$queryRaw`
        SELECT u.id, u.email, u.role, r.name as rbac_role, r.hierarchy_level
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND ur.is_active = true
        WHERE u.email = 'test.admin@smarttech.com'
        ORDER BY r.hierarchy_level DESC
        LIMIT 1
      `;

      expect(result.length).toBeGreaterThan(0);
      const user = result[0];
      expect(user.role).toBe('admin');
      expect(user.rbac_role).toBe('ADMIN');
      expect(user.hierarchy_level).toBe(80);
    });

    it('should verify test.superadmin@smarttech.com has super_admin role', async () => {
      const result = await databaseService.prisma.$queryRaw`
        SELECT u.id, u.email, u.role, r.name as rbac_role, r.hierarchy_level
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND ur.is_active = true
        WHERE u.email = 'test.superadmin@smarttech.com'
        ORDER BY r.hierarchy_level DESC
        LIMIT 1
      `;

      expect(result.length).toBeGreaterThan(0);
      const user = result[0];
      expect(user.role).toBe('super_admin');
      expect(user.rbac_role).toBe('SUPER_ADMIN');
      expect(user.hierarchy_level).toBe(100);
    });
  });

  /**
   * Test Suite 2: INSERT Trigger Functionality
   * 
   * This test verifies that when a new RBAC role is assigned to a user,
   * the INSERT trigger automatically updates the legacy users.role column.
   */
  describe('2. INSERT Trigger Functionality', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should update legacy role when ADMIN role is assigned via INSERT trigger', async () => {
      // Initial state: user should have customer role
      let legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');

      // Assign ADMIN role
      await assignRBACRole(testUser.id, 'ADMIN');

      // Verify legacy role was updated by INSERT trigger
      legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');
    });

    it('should update legacy role when SUPPORT role is assigned via INSERT trigger', async () => {
      // Assign SUPPORT role
      await assignRBACRole(testUser.id, 'SUPPORT');

      // Verify legacy role was updated
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('support');
    });

    it('should update legacy role when CORPORATE role is assigned via INSERT trigger', async () => {
      // Assign CORPORATE role
      await assignRBACRole(testUser.id, 'CORPORATE');

      // Verify legacy role was updated
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('corporate');
    });

    it('should update legacy role when SUPER_ADMIN role is assigned via INSERT trigger', async () => {
      // Assign SUPER_ADMIN role
      await assignRBACRole(testUser.id, 'SUPER_ADMIN');

      // Verify legacy role was updated
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('super_admin');
    });
  });

  /**
   * Test Suite 3: UPDATE Trigger Functionality
   * 
   * This test verifies that when a user's RBAC role is changed,
   * the UPDATE trigger automatically updates the legacy users.role column.
   */
  describe('3. UPDATE Trigger Functionality', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
      // Assign initial role
      await assignRBACRole(testUser.id, 'CUSTOMER');
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should update legacy role when role is changed from CUSTOMER to ADMIN', async () => {
      // Initial state
      let legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');

      // Update role from CUSTOMER to ADMIN
      await updateRBACRole(testUser.id, 'CUSTOMER', 'ADMIN');

      // Verify legacy role was updated by UPDATE trigger
      legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');
    });

    it('should update legacy role when role is changed from ADMIN to SUPER_ADMIN', async () => {
      // Assign ADMIN first
      await updateRBACRole(testUser.id, 'CUSTOMER', 'ADMIN');
      
      // Update role from ADMIN to SUPER_ADMIN
      await updateRBACRole(testUser.id, 'ADMIN', 'SUPER_ADMIN');

      // Verify legacy role was updated
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('super_admin');
    });

    it('should update legacy role when role is changed from SUPER_ADMIN to SUPPORT', async () => {
      // Assign SUPER_ADMIN first
      await updateRBACRole(testUser.id, 'CUSTOMER', 'SUPER_ADMIN');
      
      // Update role from SUPER_ADMIN to SUPPORT
      await updateRBACRole(testUser.id, 'SUPER_ADMIN', 'SUPPORT');

      // Verify legacy role was updated
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('support');
    });

    it('should update legacy role when role is_active status changes', async () => {
      // Assign ADMIN role
      await updateRBACRole(testUser.id, 'CUSTOMER', 'ADMIN');
      
      // Deactivate the role
      await databaseService.prisma.$queryRaw`
        UPDATE user_roles
        SET is_active = false
        WHERE user_id = ${testUser.id}
          AND role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
      `;

      // Verify legacy role was updated to customer (default)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');
    });
  });

  /**
   * Test Suite 4: DELETE Trigger Functionality
   * 
   * This test verifies that when an RBAC role is removed from a user,
   * the DELETE trigger automatically updates the legacy users.role column.
   */
  describe('4. DELETE Trigger Functionality', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
      // Assign ADMIN role
      await assignRBACRole(testUser.id, 'ADMIN');
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should update legacy role to customer when ADMIN role is removed', async () => {
      // Initial state: user should have admin role
      let legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');

      // Remove ADMIN role
      await removeRBACRole(testUser.id, 'ADMIN');

      // Verify legacy role was updated to customer by DELETE trigger
      legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');
    });

    it('should update legacy role to next highest when multiple roles exist', async () => {
      // Assign multiple roles
      await assignRBACRole(testUser.id, 'SUPER_ADMIN');
      await assignRBACRole(testUser.id, 'SUPPORT');

      // Verify current role is SUPER_ADMIN (highest)
      let legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('super_admin');

      // Remove SUPER_ADMIN role
      await removeRBACRole(testUser.id, 'SUPER_ADMIN');

      // Verify legacy role was updated to ADMIN (next highest)
      legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');
    });

    it('should update legacy role when all roles are removed', async () => {
      // Remove the ADMIN role that was assigned in beforeEach
      await removeRBACRole(testUser.id, 'ADMIN');

      // Verify legacy role was updated to customer (default)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');
    });
  });

  /**
   * Test Suite 5: Multi-Role Scenario
   * 
   * This test verifies that when a user has multiple RBAC roles,
   * the legacy role is set to the highest hierarchy_level role.
   */
  describe('5. Multi-Role Scenario', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should set legacy role to SUPER_ADMIN when user has SUPER_ADMIN, ADMIN, and SUPPORT roles', async () => {
      // Assign multiple roles
      await assignRBACRole(testUser.id, 'SUPPORT');
      await assignRBACRole(testUser.id, 'ADMIN');
      await assignRBACRole(testUser.id, 'SUPER_ADMIN');

      // Verify legacy role is SUPER_ADMIN (highest level 100)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('super_admin');

      // Verify user has all three roles
      const rbacRoles = await getUserRBACRoles(testUser.id);
      expect(rbacRoles.length).toBe(3);
      expect(rbacRoles.map(r => r.name)).toContain('SUPER_ADMIN');
      expect(rbacRoles.map(r => r.name)).toContain('ADMIN');
      expect(rbacRoles.map(r => r.name)).toContain('SUPPORT');
    });

    it('should set legacy role to ADMIN when user has ADMIN and SUPPORT roles', async () => {
      // Assign ADMIN and SUPPORT roles
      await assignRBACRole(testUser.id, 'SUPPORT');
      await assignRBACRole(testUser.id, 'ADMIN');

      // Verify legacy role is ADMIN (highest level 80 vs 50)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');
    });

    it('should set legacy role to CORPORATE when user has CORPORATE and CUSTOMER roles', async () => {
      // Assign CORPORATE and CUSTOMER roles
      await assignRBACRole(testUser.id, 'CUSTOMER');
      await assignRBACRole(testUser.id, 'CORPORATE');

      // Verify legacy role is CORPORATE (highest level 40 vs 20)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('corporate');
    });

    it('should update legacy role when highest role is removed', async () => {
      // Assign multiple roles
      await assignRBACRole(testUser.id, 'SUPPORT');
      await assignRBACRole(testUser.id, 'ADMIN');
      await assignRBACRole(testUser.id, 'SUPER_ADMIN');

      // Verify current role is SUPER_ADMIN
      let legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('super_admin');

      // Remove SUPER_ADMIN role
      await removeRBACRole(testUser.id, 'SUPER_ADMIN');

      // Verify legacy role was updated to ADMIN (next highest)
      legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('admin');
    });
  });

  /**
   * Test Suite 6: Default Behavior
   * 
   * This test verifies that when a user has no active RBAC roles,
   * the legacy role defaults to 'customer'.
   */
  describe('6. Default Behavior', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should default to customer role when user has no RBAC roles', async () => {
      // Verify legacy role is customer (default)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');

      // Verify user has no RBAC roles
      const rbacRoles = await getUserRBACRoles(testUser.id);
      expect(rbacRoles.length).toBe(0);
    });

    it('should default to customer role when all RBAC roles are expired', async () => {
      // Assign a role with an expiration date in the past
      await databaseService.prisma.$queryRaw`
        INSERT INTO user_roles (user_id, role_id, assigned_at, expires_at, is_active)
        VALUES (
          ${testUser.id},
          (SELECT id FROM roles WHERE name = 'ADMIN'),
          NOW(),
          NOW() - INTERVAL '1 day',
          true
        )
      `;

      // Verify legacy role is customer (expired role should not count)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');
    });

    it('should default to customer role when all RBAC roles are inactive', async () => {
      // Assign a role but mark it as inactive
      await databaseService.prisma.$queryRaw`
        INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
        VALUES (
          ${testUser.id},
          (SELECT id FROM roles WHERE name = 'ADMIN'),
          NOW(),
          false
        )
      `;

      // Verify legacy role is customer (inactive role should not count)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('customer');
    });

    it('should ignore expired roles when determining highest active role', async () => {
      // Assign multiple roles with different expiration statuses
      await assignRBACRole(testUser.id, 'SUPPORT'); // Active
      await databaseService.prisma.$queryRaw`
        INSERT INTO user_roles (user_id, role_id, assigned_at, expires_at, is_active)
        VALUES (
          ${testUser.id},
          (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'),
          NOW(),
          NOW() - INTERVAL '1 day',
          true
        )
      `; // Expired

      // Verify legacy role is SUPPORT (highest active role, SUPER_ADMIN is expired)
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('support');
    });
  });

  /**
   * Test Suite 7: Edge Cases and Error Handling
   * 
   * This test suite verifies the triggers handle edge cases correctly.
   */
  describe('7. Edge Cases and Error Handling', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
      testUserIds.push(testUser.id);
    });

    afterEach(async () => {
      if (testUser) {
        await deleteTestUser(testUser.id);
      }
    });

    it('should handle assigning the same role twice (should fail due to unique constraint)', async () => {
      // Assign ADMIN role
      await assignRBACRole(testUser.id, 'ADMIN');

      // Try to assign ADMIN role again (should fail)
      await expect(
        assignRBACRole(testUser.id, 'ADMIN')
      ).rejects.toThrow();
    });

    it('should handle removing a role that does not exist', async () => {
      // Try to remove a role that was never assigned
      const result = await removeRBACRole(testUser.id, 'ADMIN');
      expect(result).toBeUndefined();
    });

    it('should handle updating a role that does not exist', async () => {
      // Try to update a role that was never assigned
      const result = await updateRBACRole(testUser.id, 'ADMIN', 'SUPER_ADMIN');
      expect(result).toBeUndefined();
    });

    it('should maintain data integrity when triggers fire rapidly', async () => {
      // Rapidly assign and remove roles
      await assignRBACRole(testUser.id, 'ADMIN');
      await assignRBACRole(testUser.id, 'SUPPORT');
      await removeRBACRole(testUser.id, 'ADMIN');
      await assignRBACRole(testUser.id, 'CORPORATE');
      await removeRBACRole(testUser.id, 'SUPPORT');

      // Verify final state is correct
      const legacyRole = await getUserLegacyRole(testUser.id);
      expect(legacyRole).toBe('corporate');

      const rbacRoles = await getUserRBACRoles(testUser.id);
      expect(rbacRoles.length).toBe(1);
      expect(rbacRoles[0].name).toBe('CORPORATE');
    });
  });

  /**
   * Test Suite 8: Role Hierarchy Verification
   * 
   * This test verifies that the role hierarchy levels are correctly enforced.
   */
  describe('8. Role Hierarchy Verification', () => {
    it('should verify role hierarchy levels are correct', async () => {
      const result = await databaseService.prisma.$queryRaw`
        SELECT name, hierarchy_level FROM roles ORDER BY hierarchy_level
      `;

      expect(result).toEqual([
        { name: 'CUSTOMER', hierarchy_level: 20 },
        { name: 'CORPORATE', hierarchy_level: 40 },
        { name: 'SUPPORT', hierarchy_level: 50 },
        { name: 'ADMIN', hierarchy_level: 80 },
        { name: 'SUPER_ADMIN', hierarchy_level: 100 }
      ]);
    });

    it('should verify trigger uses highest hierarchy_level correctly', async () => {
      const testUser = await createTestUser();
      testUserIds.push(testUser.id);

      try {
        // Assign roles in random order
        await assignRBACRole(testUser.id, 'ADMIN');
        await assignRBACRole(testUser.id, 'CUSTOMER');
        await assignRBACRole(testUser.id, 'SUPER_ADMIN');
        await assignRBACRole(testUser.id, 'SUPPORT');

        // Verify legacy role is SUPER_ADMIN (highest level)
        const legacyRole = await getUserLegacyRole(testUser.id);
        expect(legacyRole).toBe('super_admin');
      } finally {
        await deleteTestUser(testUser.id);
      }
    });
  });
});
