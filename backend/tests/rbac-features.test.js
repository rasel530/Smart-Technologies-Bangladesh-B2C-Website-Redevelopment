/**
 * RBAC Features Comprehensive Test Suite
 * 
 * This test suite covers all three major RBAC features implemented:
 * 1. View Permissions Button Fix (GET /api/rbac/roles/:id)
 * 2. Edit Permissions Feature (PUT /api/rbac/roles/:roleId/permissions)
 * 3. User Creation Feature (POST /api/rbac/users, GET /api/rbac/users)
 * 
 * Test Coverage:
 * - Success scenarios for all endpoints
 * - Error handling (404, 403, 400, 409)
 * - Authentication requirements
 * - Authorization checks
 * - Input validation
 * - Edge cases
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
const RBAC_TEST_CONFIG = {
  BASE_URL: '/api/rbac',
  JWT_SECRET: process.env.JWT_SECRET || 'test_secret_key',
  TEST_ROLES: [
    { name: 'TEST_ROLE_1', description: 'Test role 1', hierarchy_level: 10 },
    { name: 'TEST_ROLE_2', description: 'Test role 2', hierarchy_level: 20 }
  ],
  TEST_PERMISSIONS: [
    { name: 'test:read', resource: 'test', action: 'read', description: 'Test read permission' },
    { name: 'test:write', resource: 'test', action: 'write', description: 'Test write permission' },
    { name: 'test:delete', resource: 'test', action: 'delete', description: 'Test delete permission' },
    { name: 'user:read', resource: 'user', action: 'read', description: 'User read permission' },
    { name: 'user:assign_role', resource: 'user', action: 'assign_role', description: 'Assign role permission' }
  ]
};

/**
 * Helper function to generate RBAC test token with proper structure
 */
const generateRBACToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      userId: user.id,
      role: user.role || 'CUSTOMER' 
    },
    RBAC_TEST_CONFIG.JWT_SECRET,
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
 * Helper function to create test permission
 */
const createTestPermission = async (permissionData = {}) => {
  return testPrisma.permissions.create({
    data: {
      name: permissionData.name || `test:permission_${Date.now()}`,
      resource: permissionData.resource || 'test',
      action: permissionData.action || 'read',
      description: permissionData.description || 'Test permission'
    }
  });
};

/**
 * Helper function to assign permission to role
 */
const assignPermissionToRole = async (roleId, permissionId, grantedBy) => {
  return testPrisma.role_permissions.create({
    data: {
      role_id: roleId,
      permission_id: permissionId,
      granted_by: grantedBy
    }
  });
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
      status: 'ACTIVE'
    }
  });

  const token = generateRBACToken(user);
  return { user, token };
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
      status: 'ACTIVE'
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

  const token = generateRBACToken(user);
  return { user, token };
};

/**
 * Helper function to clean up RBAC test data
 */
const cleanupRBACTestData = async () => {
  await testPrisma.user_roles.deleteMany({});
  await testPrisma.role_permissions.deleteMany({});
  await testPrisma.permissions.deleteMany({
    where: { name: { startsWith: 'test:' } }
  });
  await testPrisma.roles.deleteMany({
    where: { name: { startsWith: 'TEST_ROLE' } }
  });
  await testPrisma.user.deleteMany({
    where: { email: { contains: 'rbac-test' } }
  });
};

describe('RBAC Features Comprehensive Test Suite', () => {
  let superAdmin, adminUser, regularUser, testRole, testPermissions;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupRBACTestData();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupRBACTestData();
    
    // Create test users
    superAdmin = await createTestSuperAdmin();
    adminUser = await createTestUserWithRBAC({ email: `admin-${Date.now()}@example.com` });
    regularUser = await createTestUserWithRBAC({ email: `user-${Date.now()}@example.com` });
    
    // Create test role
    testRole = await createTestRole();
    
    // Create test permissions
    testPermissions = await Promise.all([
      createTestPermission({ name: 'test:read', resource: 'test', action: 'read' }),
      createTestPermission({ name: 'test:write', resource: 'test', action: 'write' }),
      createTestPermission({ name: 'user:assign_role', resource: 'user', action: 'assign_role' })
    ]);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupRBACTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupRBACTestData();
    await testPrisma.$disconnect();
  });

  /**
   * ============================================================================
   * FEATURE 1: View Permissions Button Fix Tests
   * GET /api/rbac/roles/:id - Returns role with permissions
   * ============================================================================
   */
  describe('Feature 1: View Permissions Button Fix (GET /api/rbac/roles/:id)', () => {
    describe('Success Scenarios', () => {
      it('should return role details with permissions array', async () => {
        // Assign permissions to role
        await Promise.all([
          assignPermissionToRole(testRole.id, testPermissions[0].id, superAdmin.user.id),
          assignPermissionToRole(testRole.id, testPermissions[1].id, superAdmin.user.id)
        ]);

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Role retrieved successfully');
        expect(response.body).toHaveProperty('data');
        
        const roleData = response.body.data;
        expect(roleData).toHaveProperty('id', testRole.id);
        expect(roleData).toHaveProperty('name', testRole.name);
        expect(roleData).toHaveProperty('description', testRole.description);
        expect(roleData).toHaveProperty('hierarchy_level', testRole.hierarchy_level);
        expect(roleData).toHaveProperty('permissions');
        expect(Array.isArray(roleData.permissions)).toBe(true);
        expect(roleData.permissions.length).toBe(2);
        
        // Verify permission structure
        roleData.permissions.forEach(permission => {
          expect(permission).toHaveProperty('id');
          expect(permission).toHaveProperty('name');
          expect(permission).toHaveProperty('resource');
          expect(permission).toHaveProperty('action');
          expect(permission).toHaveProperty('description');
          expect(permission).toHaveProperty('granted_at');
          expect(permission).toHaveProperty('granted_by');
        });
      });

      it('should return role with empty permissions array when no permissions assigned', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('permissions');
        expect(Array.isArray(response.body.data.permissions)).toBe(true);
        expect(response.body.data.permissions.length).toBe(0);
      });

      it('should return permissions sorted by resource and action', async () => {
        // Assign permissions in random order
        await assignPermissionToRole(testRole.id, testPermissions[1].id, superAdmin.user.id);
        await assignPermissionToRole(testRole.id, testPermissions[0].id, superAdmin.user.id);

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
        const permissions = response.body.data.permissions;
        expect(permissions.length).toBeGreaterThan(0);
        
        // Verify sorting (permissions should be sorted by resource, then action)
        for (let i = 1; i < permissions.length; i++) {
          const prev = permissions[i - 1];
          const curr = permissions[i];
          if (prev.resource === curr.resource) {
            expect(prev.action <= curr.action).toBe(true);
          }
        }
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent role', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${fakeId}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Not found');
        expect(response.body).toHaveProperty('message', 'Role not found');
      });

      it('should return 400 for invalid UUID format', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/invalid-uuid`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      });

      it('should return 401 for unauthenticated request', async () => {
        const response = await request(app)
          .get(`${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`);

        expect(response.status).toBe(401);
      });
    });

    describe('Edge Cases', () => {
      it('should handle role with many permissions gracefully', async () => {
        // Create many permissions
        const manyPermissions = await Promise.all(
          Array(20).fill(null).map((_, i) => 
            createTestPermission({ 
              name: `test:perm_${i}`, 
              resource: 'test', 
              action: `action_${i}` 
            })
          )
        );

        // Assign all permissions to role
        await Promise.all(
          manyPermissions.map(p => 
            assignPermissionToRole(testRole.id, p.id, superAdmin.user.id)
          )
        );

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
          {},
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data.permissions.length).toBe(20);
      });
    });
  });

  /**
   * ============================================================================
   * FEATURE 2: Edit Permissions Feature Tests
   * PUT /api/rbac/roles/:roleId/permissions - Bulk update permissions
   * ============================================================================
   */
  describe('Feature 2: Edit Permissions Feature (PUT /api/rbac/roles/:roleId/permissions)', () => {
    describe('Success Scenarios', () => {
      it('should bulk update permissions - add new permissions', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [testPermissions[0].id, testPermissions[1].id]
          },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Role permissions updated successfully');
        expect(response.body).toHaveProperty('data');
        
        const data = response.body.data;
        expect(data).toHaveProperty('roleId', testRole.id);
        expect(data).toHaveProperty('roleName', testRole.name);
        expect(data).toHaveProperty('permissions');
        expect(data).toHaveProperty('addedCount', 2);
        expect(data).toHaveProperty('removedCount', 0);
        
        expect(Array.isArray(data.permissions)).toBe(true);
        expect(data.permissions.length).toBe(2);
      });

      it('should bulk update permissions - remove permissions', async () => {
        // First assign permissions
        await Promise.all([
          assignPermissionToRole(testRole.id, testPermissions[0].id, superAdmin.user.id),
          assignPermissionToRole(testRole.id, testPermissions[1].id, superAdmin.user.id)
        ]);

        // Then remove all permissions
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          { permissions: [] },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data.addedCount).toBe(0);
        expect(response.body.data.removedCount).toBe(2);
        expect(response.body.data.permissions.length).toBe(0);
      });

      it('should bulk update permissions - add and remove simultaneously', async () => {
        // Assign initial permissions
        await assignPermissionToRole(testRole.id, testPermissions[0].id, superAdmin.user.id);

        // Update to different set
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [testPermissions[1].id, testPermissions[2].id]
          },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data.addedCount).toBe(2);
        expect(response.body.data.removedCount).toBe(1);
        expect(response.body.data.permissions.length).toBe(2);
      });

      it('should return updated permissions after bulk update', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [testPermissions[0].id, testPermissions[1].id]
          },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        const permissions = response.body.data.permissions;
        
        permissions.forEach(permission => {
          expect(permission).toHaveProperty('id');
          expect(permission).toHaveProperty('name');
          expect(permission).toHaveProperty('resource');
          expect(permission).toHaveProperty('action');
          expect(permission).toHaveProperty('description');
        });
      });

      it('should handle empty permissions array', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          { permissions: [] },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data.permissions).toEqual([]);
        expect(response.body.data.addedCount).toBe(0);
        expect(response.body.data.removedCount).toBe(0);
      });

      it('should handle duplicate permission IDs gracefully', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [testPermissions[0].id, testPermissions[0].id]
          },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        // Should only add once (skipDuplicates)
        expect(response.body.data.addedCount).toBeLessThanOrEqual(1);
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent role', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${fakeId}/permissions`,
          { permissions: [testPermissions[0].id] },
          superAdmin.token
        );

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Not found');
        expect(response.body).toHaveProperty('message', 'Role not found');
      });

      it('should return 400 for invalid permission IDs', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [
              '550e8400-e29b-41d4-a716-446655440000',
              '660e8400-e29b-41d4-a716-446655440001'
            ]
          },
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid permission IDs');
        expect(response.body).toHaveProperty('message', 'One or more permission IDs do not exist');
        expect(response.body).toHaveProperty('invalidIds');
        expect(Array.isArray(response.body.invalidIds)).toBe(true);
      });

      it('should return 400 for non-array permissions', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          { permissions: 'not-an-array' },
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      });

      it('should return 400 for invalid UUID in permissions array', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          { permissions: ['invalid-uuid'] },
          superAdmin.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      });

      it('should return 401 for unauthenticated request', async () => {
        const response = await request(app)
          .put(`${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`)
          .send({ permissions: [testPermissions[0].id] });

        expect(response.status).toBe(401);
      });

      it('should return 403 for unauthorized user', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          { permissions: [testPermissions[0].id] },
          regularUser.token
        );

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Access denied');
      });
    });

    describe('Edge Cases', () => {
      it('should handle large permissions array', async () => {
        // Create many permissions
        const manyPermissions = await Promise.all(
          Array(50).fill(null).map((_, i) => 
            createTestPermission({ 
              name: `test:bulk_${i}`, 
              resource: 'test', 
              action: `action_${i}` 
            })
          )
        );

        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: manyPermissions.map(p => p.id)
          },
          superAdmin.token
        );

        expect(response.status).toBe(200);
        expect(response.body.data.permissions.length).toBe(50);
      });

      it('should handle transaction rollback on error', async () => {
        // Try to add invalid permissions
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
          {
            permissions: [
              testPermissions[0].id,
              '550e8400-e29b-41d4-a716-446655440000' // Invalid
            ]
          },
          superAdmin.token
        );

        expect(response.status).toBe(400);
        
        // Verify no permissions were added
        const role = await testPrisma.roles.findFirst({
          where: { id: testRole.id },
          include: { permissions: true }
        });
        expect(role.permissions.length).toBe(0);
      });
    });
  });

  /**
   * ============================================================================
   * FEATURE 3: User Creation Feature Tests
   * POST /api/rbac/users - Create user with role assignment
   * GET /api/rbac/users - List users with pagination
   * ============================================================================
   */
  describe('Feature 3: User Creation Feature', () => {
    describe('POST /api/rbac/users - Create User with Roles', () => {
      describe('Success Scenarios', () => {
        it('should create user with single role', async () => {
          const userData = {
            email: `new-user-${Date.now()}@example.com`,
            phone: '+8801712345678',
            password: 'TestPassword123!',
            first_name: 'John',
            last_name: 'Doe',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('message', 'User created successfully');
          expect(response.body).toHaveProperty('data');
          
          const data = response.body.data;
          expect(data).toHaveProperty('user');
          expect(data).toHaveProperty('roles');
          
          expect(data.user).toHaveProperty('id');
          expect(data.user).toHaveProperty('email', userData.email);
          expect(data.user).toHaveProperty('phone', userData.phone);
          expect(data.user).toHaveProperty('firstName', userData.first_name);
          expect(data.user).toHaveProperty('lastName', userData.last_name);
          expect(data.user).toHaveProperty('status', 'active');
          expect(data.user).not.toHaveProperty('password');
          
          expect(Array.isArray(data.roles)).toBe(true);
          expect(data.roles.length).toBe(1);
          expect(data.roles[0]).toHaveProperty('id', testRole.id);
          expect(data.roles[0]).toHaveProperty('name', testRole.name);
        });

        it('should create user with multiple roles', async () => {
          const secondRole = await createTestRole({ 
            name: `TEST_ROLE_2_${Date.now()}`, 
            hierarchy_level: 20 
          });

          const userData = {
            email: `multi-role-${Date.now()}@example.com`,
            phone: '+8801712345679',
            password: 'TestPassword123!',
            first_name: 'Jane',
            last_name: 'Smith',
            role_ids: [testRole.id, secondRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(201);
          expect(response.body.data.roles.length).toBe(2);
        });

        it('should create user without phone number', async () => {
          const userData = {
            email: `no-phone-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(201);
          expect(response.body.data.user.phone).toBeNull();
        });

        it('should hash password before storing', async () => {
          const userData = {
            email: `hash-test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Hash',
            last_name: 'Test',
            role_ids: [testRole.id]
          };

          await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          // Verify password is hashed in database
          const user = await testPrisma.user.findUnique({
            where: { email: userData.email }
          });

          expect(user).toBeDefined();
          expect(user.password).not.toBe(userData.password);
          expect(user.password.length).toBeGreaterThan(50); // Bcrypt hash length
        });

        it('should save password to history', async () => {
          const userData = {
            email: `history-test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'History',
            last_name: 'Test',
            role_ids: [testRole.id]
          };

          await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          // Verify password history
          const user = await testPrisma.user.findUnique({
            where: { email: userData.email }
          });

          const passwordHistory = await testPrisma.passwordHistory.findFirst({
            where: { userId: user.id }
          });

          expect(passwordHistory).toBeDefined();
          expect(passwordHistory.passwordHash).toBe(user.password);
        });
      });

      describe('Validation Tests', () => {
        it('should validate email format', async () => {
          const userData = {
            email: 'invalid-email',
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Invalid email format');
        });

        it('should validate password strength', async () => {
          const userData = {
            email: `weak-pass-${Date.now()}@example.com`,
            password: 'weak',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Password does not meet requirements');
          expect(response.body).toHaveProperty('details');
          expect(response.body.details).toHaveProperty('strength');
          expect(response.body.details).toHaveProperty('feedback');
        });

        it('should validate password length', async () => {
          const userData = {
            email: `short-pass-${Date.now()}@example.com`,
            password: 'Short1!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
        });

        it('should validate required fields', async () => {
          const userData = {
            email: `missing-fields-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
          'POST',
          `${RBAC_TEST_CONFIG.BASE_URL}/users`,
          userData,
          superAdmin.token
        );

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Validation failed');
        });

        it('should validate phone format if provided', async () => {
          const userData = {
            email: `bad-phone-${Date.now()}@example.com`,
            phone: 'invalid-phone',
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Invalid phone format');
        });

        it('should validate role_ids is an array', async () => {
          const userData = {
            email: `bad-roles-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: 'not-an-array'
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
        });

        it('should validate role_ids is not empty', async () => {
          const userData = {
            email: `empty-roles-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: []
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
        });
      });

      describe('Error Handling', () => {
        it('should return 409 for duplicate email', async () => {
          const userData = {
            email: `duplicate-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          // Create first user
          await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          // Try to create second user with same email
          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('error', 'Email already exists');
        });

        it('should return 409 for duplicate phone', async () => {
          const userData = {
            email: `dup-phone1-${Date.now()}@example.com`,
            phone: '+8801712345678',
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          // Create first user
          await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          // Try to create second user with same phone
          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            {
              email: `dup-phone2-${Date.now()}@example.com`,
              phone: '+8801712345678',
              password: 'TestPassword123!',
              first_name: 'Test',
              last_name: 'User',
              role_ids: [testRole.id]
            },
            superAdmin.token
          );

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('error', 'Phone already exists');
        });

        it('should return 400 for invalid role IDs', async () => {
          const userData = {
            email: `bad-role-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: ['550e8400-e29b-41d4-a716-446655440000']
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Invalid role IDs');
        });

        it('should return 403 for unauthorized user', async () => {
          const userData = {
            email: `unauth-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            regularUser.token
          );

          expect(response.status).toBe(403);
        });

        it('should return 401 for unauthenticated request', async () => {
          const userData = {
            email: `no-auth-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [testRole.id]
          };

          const response = await request(app)
            .post(`${RBAC_TEST_CONFIG.BASE_URL}/users`)
            .send(userData);

          expect(response.status).toBe(401);
        });
      });

      describe('Edge Cases', () => {
        it('should handle transaction rollback on error', async () => {
          const userData = {
            email: `rollback-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role_ids: [
              testRole.id,
              '550e8400-e29b-41d4-a716-446655440000' // Invalid
            ]
          };

          const response = await makeAuthenticatedRequest(
            app,
            'POST',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            userData,
            superAdmin.token
          );

          expect(response.status).toBe(400);
          
          // Verify user was not created
          const user = await testPrisma.user.findUnique({
            where: { email: userData.email }
          });
          expect(user).toBeNull();
        });
      });
    });

    describe('GET /api/rbac/users - List Users with Pagination', () => {
      describe('Success Scenarios', () => {
        beforeEach(async () => {
          // Create multiple test users
          await Promise.all([
            makeAuthenticatedRequest(
              app,
              'POST',
              `${RBAC_TEST_CONFIG.BASE_URL}/users`,
              {
                email: `list1-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                first_name: 'User',
                last_name: 'One',
                role_ids: [testRole.id]
              },
              superAdmin.token
            ),
            makeAuthenticatedRequest(
              app,
              'POST',
              `${RBAC_TEST_CONFIG.BASE_URL}/users`,
              {
                email: `list2-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                first_name: 'User',
                last_name: 'Two',
                role_ids: [testRole.id]
              },
              superAdmin.token
            ),
            makeAuthenticatedRequest(
              app,
              'POST',
              `${RBAC_TEST_CONFIG.BASE_URL}/users`,
              {
                email: `list3-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                first_name: 'User',
                last_name: 'Three',
                role_ids: [testRole.id]
              },
              superAdmin.token
            )
          ]);
        });

        it('should return paginated list of users', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?page=1&limit=10`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('message', 'Users retrieved successfully');
          expect(response.body).toHaveProperty('data');
          
          const data = response.body.data;
          expect(data).toHaveProperty('users');
          expect(data).toHaveProperty('pagination');
          
          expect(Array.isArray(data.users)).toBe(true);
          expect(data.pagination).toHaveProperty('page', 1);
          expect(data.pagination).toHaveProperty('limit', 10);
          expect(data.pagination).toHaveProperty('total');
          expect(data.pagination).toHaveProperty('pages');
        });

        it('should respect pagination parameters', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?page=1&limit=2`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          expect(response.body.data.users.length).toBeLessThanOrEqual(2);
          expect(response.body.data.pagination.page).toBe(1);
          expect(response.body.data.pagination.limit).toBe(2);
        });

        it('should include user roles in response', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          const users = response.body.data.users;
          
          if (users.length > 0) {
            const user = users[0];
            expect(user).toHaveProperty('roles');
            expect(Array.isArray(user.roles)).toBe(true);
            
            if (user.roles.length > 0) {
              expect(user.roles[0]).toHaveProperty('id');
              expect(user.roles[0]).toHaveProperty('name');
              expect(user.roles[0]).toHaveProperty('description');
              expect(user.roles[0]).toHaveProperty('hierarchy_level');
              expect(user.roles[0]).toHaveProperty('assigned_at');
            }
          }
        });

        it('should filter users by search term - email', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=list1`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          const users = response.body.data.users;
          expect(users.length).toBeGreaterThan(0);
          expect(users.some(u => u.email.includes('list1'))).toBe(true);
        });

        it('should filter users by search term - first name', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=User`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          const users = response.body.data.users;
          expect(users.length).toBeGreaterThan(0);
        });

        it('should filter users by search term - last name', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=One`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          const users = response.body.data.users;
          expect(users.length).toBeGreaterThan(0);
        });

        it('should handle case-insensitive search', async () => {
          const responseLower = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=user`,
            {},
            superAdmin.token
          );

          const responseUpper = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=USER`,
            {},
            superAdmin.token
          );

          expect(responseLower.status).toBe(200);
          expect(responseUpper.status).toBe(200);
          expect(responseLower.body.data.users.length).toBe(responseUpper.body.data.users.length);
        });

        it('should return users sorted by created_at desc', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          const users = response.body.data.users;
          
          if (users.length > 1) {
            for (let i = 1; i < users.length; i++) {
              const prevDate = new Date(users[i - 1].created_at);
              const currDate = new Date(users[i].created_at);
              expect(prevDate >= currDate).toBe(true);
            }
          }
        });

        it('should handle empty result set', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?search=nonexistentuser`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          expect(response.body.data.users.length).toBe(0);
          expect(response.body.data.pagination.total).toBe(0);
        });
      });

      describe('Error Handling', () => {
        it('should return 401 for unauthenticated request', async () => {
          const response = await request(app)
            .get(`${RBAC_TEST_CONFIG.BASE_URL}/users`);

          expect(response.status).toBe(401);
        });

        it('should return 403 for unauthorized user', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users`,
            {},
            regularUser.token
          );

          expect(response.status).toBe(403);
        });
      });

      describe('Edge Cases', () => {
        it('should handle large page numbers gracefully', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?page=999`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          expect(response.body.data.users.length).toBe(0);
        });

        it('should handle invalid pagination parameters', async () => {
          const response = await makeAuthenticatedRequest(
            app,
            'GET',
            `${RBAC_TEST_CONFIG.BASE_URL}/users?page=-1&limit=0`,
            {},
            superAdmin.token
          );

          expect(response.status).toBe(200);
          // Should use defaults
          expect(response.body.data.pagination.page).toBe(1);
        });
      });
    });
  });

  /**
   * ============================================================================
   * Integration Tests - Cross-Feature Testing
   * ============================================================================
   */
  describe('Integration Tests - Cross-Feature Testing', () => {
    it('should create user, assign role, update permissions, and verify', async () => {
      // 1. Create role with initial permissions
      await Promise.all([
        assignPermissionToRole(testRole.id, testPermissions[0].id, superAdmin.user.id)
      ]);

      // 2. Create user with role
      const userData = {
        email: `integration-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        first_name: 'Integration',
        last_name: 'Test',
        role_ids: [testRole.id]
      };

      const createResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        `${RBAC_TEST_CONFIG.BASE_URL}/users`,
        userData,
        superAdmin.token
      );

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.data.user.id;

      // 3. Update role permissions
      const updateResponse = await makeAuthenticatedRequest(
        app,
        'PUT',
        `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}/permissions`,
        {
          permissions: [testPermissions[0].id, testPermissions[1].id]
        },
        superAdmin.token
      );

      expect(updateResponse.status).toBe(200);

      // 4. Verify role has updated permissions
      const roleResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
        {},
        superAdmin.token
      );

      expect(roleResponse.status).toBe(200);
      expect(roleResponse.body.data.permissions.length).toBe(2);

      // 5. Verify user appears in list
      const listResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `${RBAC_TEST_CONFIG.BASE_URL}/users?search=${userData.email}`,
        {},
        superAdmin.token
      );

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.users.length).toBeGreaterThan(0);
      expect(listResponse.body.data.users[0].email).toBe(userData.email);
    });

    it('should handle concurrent permission updates', async () => {
      // Create multiple roles
      const roles = await Promise.all([
        createTestRole({ name: `ROLE_A_${Date.now()}`, hierarchy_level: 10 }),
        createTestRole({ name: `ROLE_B_${Date.now()}`, hierarchy_level: 20 })
      ]);

      // Update permissions concurrently
      const updates = roles.map(role =>
        makeAuthenticatedRequest(
          app,
          'PUT',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${role.id}/permissions`,
          {
            permissions: [testPermissions[0].id, testPermissions[1].id]
          },
          superAdmin.token
        )
      );

      const responses = await Promise.all(updates);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.addedCount).toBe(2);
      });
    });
  });

  /**
   * ============================================================================
   * Security Tests
   * ============================================================================
   */
  describe('Security Tests', () => {
    it('should protect against SQL injection in search', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `${RBAC_TEST_CONFIG.BASE_URL}/users?search=${encodeURIComponent(maliciousQuery)}`,
        {},
        superAdmin.token
      );

      expect(response.status).toBe(200);
      
      // Verify users table still exists
      const userCount = await testPrisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    it('should protect against XSS in user data', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const userData = {
        email: `xss-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        first_name: xssPayload,
        last_name: 'Test',
        role_ids: [testRole.id]
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `${RBAC_TEST_CONFIG.BASE_URL}/users`,
        userData,
        superAdmin.token
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should enforce rate limiting', async () => {
      // Make multiple requests rapidly
      const requests = Array(25).fill(null).map(() =>
        makeAuthenticatedRequest(
          app,
          'GET',
          `${RBAC_TEST_CONFIG.BASE_URL}/roles/${testRole.id}`,
          {},
          superAdmin.token
        )
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
