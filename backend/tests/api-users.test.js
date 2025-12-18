/**
 * User Management API Endpoint Tests
 * 
 * This test suite covers all user management endpoints including:
 * - Get all users (admin only)
 * - Get user by ID
 * - Update user profile
 * - Delete user (admin only)
 * - Get user addresses
 * - Input validation
 * - Authorization checks
 * - Error handling
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  createTestCategory,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma 
} = require('./api-test-utils');

describe('User Management API Endpoints', () => {
  let testUser, adminUser, regularUser;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test users
    testUser = await createTestUser({ email: 'testuser@example.com' });
    adminUser = await createTestAdmin({ email: 'admin@example.com' });
    regularUser = await createTestUser({ email: 'regular@example.com' });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/users', () => {
    /**
     * Test successful retrieval of all users by admin
     */
    it('should allow admin to retrieve all users', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      
      // Verify pagination structure
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
      
      // Verify user data structure
      const users = response.body.users;
      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
        expect(user).toHaveProperty('phone');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('status');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('lastLoginAt');
        expect(user).toHaveProperty('_count');
        expect(user).not.toHaveProperty('password');
      }
    });

    /**
     * Test pagination parameters
     */
    it('should respect pagination parameters', async () => {
      // Create additional users
      await Promise.all([
        createTestUser({ email: 'user1@example.com' }),
        createTestUser({ email: 'user2@example.com' }),
        createTestUser({ email: 'user3@example.com' })
      ]);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users?page=1&limit=2',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    /**
     * Test search functionality
     */
    it('should filter users by search term', async () => {
      // Create users with specific names
      await Promise.all([
        createTestUser({ 
          email: 'john@example.com', 
          firstName: 'John', 
          lastName: 'Doe' 
        }),
        createTestUser({ 
          email: 'jane@example.com', 
          firstName: 'Jane', 
          lastName: 'Smith' 
        })
      ]);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users?search=John',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      const users = response.body.users;
      expect(users.length).toBeGreaterThan(0);
      expect(users.some(user => 
        user.firstName.includes('John') || 
        user.lastName.includes('John') || 
        user.email.includes('John')
      )).toBe(true);
    });

    /**
     * Test unauthorized access for regular users
     */
    it('should deny access to regular users', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users',
        {},
        regularUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test unauthorized access without authentication
     */
    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test validation of pagination parameters
     */
    it('should validate pagination parameters', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users?page=-1&limit=0',
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    /**
     * Test successful retrieval of user by ID by admin
     */
    it('should allow admin to retrieve any user by ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${regularUser.user.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      
      const user = response.body.user;
      expect(user.id).toBe(regularUser.user.id);
      expect(user.email).toBe(regularUser.user.email);
      expect(user.firstName).toBe(regularUser.user.firstName);
      expect(user.lastName).toBe(regularUser.user.lastName);
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('dateOfBirth');
      expect(user).toHaveProperty('gender');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('image');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user).toHaveProperty('lastLoginAt');
      expect(user).toHaveProperty('addresses');
      expect(user).toHaveProperty('_count');
      expect(user).not.toHaveProperty('password');
    });

    /**
     * Test user retrieving their own profile
     */
    it('should allow user to retrieve their own profile', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${regularUser.user.id}`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(regularUser.user.id);
    });

    /**
     * Test user trying to access another user's profile
     */
    it('should deny user accessing another user\'s profile', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${testUser.user.id}`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    /**
     * Test retrieval of non-existent user
     */
    it('should return 404 for non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${fakeId}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/users/invalid-uuid',
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    /**
     * Test successful user profile update by owner
     */
    it('should allow user to update their own profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+8801987654321',
        dateOfBirth: '1990-01-01',
        gender: 'MALE'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${regularUser.user.id}`,
        updateData,
        regularUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body).toHaveProperty('user');
      
      const user = response.body.user;
      expect(user.firstName).toBe(updateData.firstName);
      expect(user.lastName).toBe(updateData.lastName);
      expect(user.phone).toBe(updateData.phone);
      expect(user.dateOfBirth).toBe(updateData.dateOfBirth);
      expect(user.gender).toBe(updateData.gender);
    });

    /**
     * Test admin updating any user's profile
     */
    it('should allow admin to update any user\'s profile', async () => {
      const updateData = {
        firstName: 'Admin',
        lastName: 'Updated'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${regularUser.user.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
    });

    /**
     * Test user trying to update another user's profile
     */
    it('should deny user updating another user\'s profile', async () => {
      const updateData = {
        firstName: 'Hacked'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${testUser.user.id}`,
        updateData,
        regularUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    /**
     * Test update with duplicate phone number
     */
    it('should prevent update with duplicate phone number', async () => {
      // Create another user with specific phone
      const anotherUser = await createTestUser({ 
        phone: '+8801555555555' 
      });

      const updateData = {
        phone: '+8801555555555' // Try to use another user's phone
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${regularUser.user.id}`,
        updateData,
        regularUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Phone number already exists');
    });

    /**
     * Test update of non-existent user
     */
    it('should return 404 when updating non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${fakeId}`,
        { firstName: 'Test' },
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    /**
     * Test validation of update data
     */
    it('should validate update data', async () => {
      const invalidData = {
        firstName: '', // Empty name
        phone: 'invalid-phone',
        gender: 'INVALID_GENDER'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${regularUser.user.id}`,
        invalidData,
        regularUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    /**
     * Test successful user deletion by admin
     */
    it('should allow admin to delete user without orders', async () => {
      const userToDelete = await createTestUser({ 
        email: 'delete@example.com' 
      });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/users/${userToDelete.user.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.user.id }
      });
      expect(deletedUser).toBeNull();
    });

    /**
     * Test deletion prevention for user with orders
     */
    it('should prevent deletion of user with existing orders', async () => {
      // Create user with order
      const userWithOrder = await createTestUser({ 
        email: 'withorder@example.com' 
      });
      await createTestOrder({ user: userWithOrder.user });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/users/${userWithOrder.user.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete user with existing orders');
      expect(response.body).toHaveProperty('suggestion', 'Consider deactivating the user instead');
    });

    /**
     * Test unauthorized deletion by regular user
     */
    it('should deny user deleting themselves or others', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/users/${regularUser.user.id}`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test deletion of non-existent user
     */
    it('should return 404 when deleting non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/users/${fakeId}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /api/v1/users/:id/addresses', () => {
    /**
     * Test successful retrieval of user addresses
     */
    it('should allow user to retrieve their own addresses', async () => {
      // Create test address
      await prisma.address.create({
        data: {
          userId: regularUser.user.id,
          firstName: regularUser.user.firstName,
          lastName: regularUser.user.lastName,
          phone: '+8801712345678',
          address: '123 Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          postalCode: '1000',
          type: 'SHIPPING',
          isDefault: true
        }
      });

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${regularUser.user.id}/addresses`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('addresses');
      expect(Array.isArray(response.body.addresses)).toBe(true);
      
      if (response.body.addresses.length > 0) {
        const address = response.body.addresses[0];
        expect(address).toHaveProperty('id');
        expect(address).toHaveProperty('firstName');
        expect(address).toHaveProperty('lastName');
        expect(address).toHaveProperty('phone');
        expect(address).toHaveProperty('address');
        expect(address).toHaveProperty('city');
        expect(address).toHaveProperty('district');
        expect(address).toHaveProperty('division');
        expect(address).toHaveProperty('postalCode');
        expect(address).toHaveProperty('type');
        expect(address).toHaveProperty('isDefault');
      }
    });

    /**
     * Test admin retrieving any user's addresses
     */
    it('should allow admin to retrieve any user\'s addresses', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${regularUser.user.id}/addresses`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('addresses');
    });

    /**
     * Test unauthorized access to another user's addresses
     */
    it('should deny user accessing another user\'s addresses', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${testUser.user.id}/addresses`,
        {},
        regularUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('User Management Bangladesh-Specific Tests', () => {
    /**
     * Test user profile with Bangladesh address
     */
    it('should handle Bangladesh-specific address fields', async () => {
      // Create user with Bangladesh address
      const bdUser = await createTestUser({ 
        email: 'bduser@example.com' 
      });

      await prisma.address.create({
        data: {
          userId: bdUser.user.id,
          firstName: bdUser.user.firstName,
          lastName: bdUser.user.lastName,
          phone: '+8801712345678',
          address: 'House 12, Road 5, Dhanmondi',
          addressLine2: 'Block A',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          upazila: 'Dhanmondi',
          postalCode: '1209',
          type: 'SHIPPING',
          isDefault: true
        }
      });

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users/${bdUser.user.id}/addresses`,
        {},
        bdUser.token
      );

      expect(response.status).toBe(200);
      const addresses = response.body.addresses;
      expect(addresses.length).toBe(1);
      
      const address = addresses[0];
      expect(address.division).toBe('DHAKA');
      expect(address.district).toBe('Dhaka');
      expect(address.upazila).toBe('Dhanmondi');
      expect(address.postalCode).toBe('1209');
    });

    /**
     * Test all Bangladesh divisions
     */
    it('should accept all Bangladesh divisions', async () => {
      const divisions = ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'];
      
      for (const division of divisions) {
        const user = await createTestUser({ 
          email: `user${division}@example.com` 
        });

        await prisma.address.create({
          data: {
            userId: user.user.id,
            firstName: user.user.firstName,
            lastName: user.user.lastName,
            phone: '+8801712345678',
            address: 'Test Address',
            city: 'Test City',
            district: 'Test District',
            division: division,
            postalCode: '1000',
            type: 'SHIPPING'
          }
        });

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/users/${user.user.id}/addresses`,
          {},
          user.token
        );

        expect(response.status).toBe(200);
        expect(response.body.addresses[0].division).toBe(division);
      }
    });
  });

  describe('User Management Security Tests', () => {
    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in user search', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/users?search=${encodeURIComponent(maliciousQuery)}`,
        {},
        adminUser.token
      );

      // Should not crash the server
      expect(response.status).toBe(200);
      
      // Verify users table still exists
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test XSS protection in user data
     */
    it('should sanitize user input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/users/${regularUser.user.id}`,
        { firstName: xssPayload },
        regularUser.token
      );

      // Should either reject or sanitize the input
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // If accepted, should be sanitized
        expect(response.body.user.firstName).not.toBe(xssPayload);
      }
    });
  });
});