/**
 * Comprehensive User Routes Testing
 * Tests all user CRUD operations, validation, and edge cases
 * 
 * This test suite covers:
 * - User CRUD operations (Create, Read, Update, Delete)
 * - User authentication and authorization
 * - User profile management
 * - User address management
 * - User role and status management
 * - Validation and error handling
 * - Edge cases and security
 */

const request = require('supertest');
const express = require('express');
const { TestHelpers } = require('../utils/testHelpers');
const { PrismaClient } = require('@prisma/client');

// Import the users routes
const usersRoutes = require('../../routes/users');
const authRoutes = require('../../routes/auth');

const prisma = new PrismaClient();

describe('User Routes - Comprehensive Testing', () => {
  let app;
  let testHelpers;
  let adminUser;
  let regularUser;
  let testUserIds = [];

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', usersRoutes);
    
    testHelpers = new TestHelpers();

    // Create admin user for testing
    adminUser = await testHelpers.createTestUser({
      email: 'test.admin@smarttech.com',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    testUserIds.push(adminUser.id);

    // Create regular user for testing
    regularUser = await testHelpers.createTestUser({
      email: 'test.user@smarttech.com',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });
    testUserIds.push(regularUser.id);
  });

  afterAll(async () => {
    // Clean up all test users
    for (const userId of testUserIds) {
      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (error) {
        console.warn(`Failed to delete test user ${userId}:`, error.message);
      }
    }
    await testHelpers.disconnect();
    await prisma.$disconnect();
  });

  /**
   * Helper function to login and get auth token
   */
  async function loginAndGetToken(user) {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: user.email,
        password: 'TestPassword123!'
      });

    return response.body.token;
  }

  /**
   * Test Suite 1: GET /api/v1/users - Get All Users
   */
  describe('GET /api/v1/users - Get All Users', () => {
    it('should get all users successfully for admin', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('should paginate users correctly', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.users.length).toBeLessThanOrEqual(10);
    });

    it('should search users by name', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get('/api/v1/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      response.body.users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        expect(fullName).toContain('test');
      });
    });

    it('should search users by email', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get(`/api/v1/users?search=${regularUser.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].email).toBe(regularUser.email);
    });

    it('should reject non-admin users from accessing all users', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should validate pagination parameters', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      await request(app)
        .get('/api/v1/users?page=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app)
        .get('/api/v1/users?limit=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should enforce maximum limit parameter', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get('/api/v1/users?limit=200')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 2: GET /api/v1/users/:id - Get User by ID
   */
  describe('GET /api/v1/users/:id - Get User by ID', () => {
    it('should get user by ID successfully for self', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(regularUser.id);
      expect(response.body.user.email).toBe(regularUser.email);
      expect(response.body.user.firstName).toBe(regularUser.firstName);
      expect(response.body.user.lastName).toBe(regularUser.lastName);
    });

    it('should get user by ID successfully for admin', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user.id).toBe(regularUser.id);
    });

    it('should include user addresses in response', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('addresses');
      expect(Array.isArray(response.body.user.addresses)).toBe(true);
    });

    it('should include order and review counts', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user._count).toHaveProperty('orders');
      expect(response.body.user._count).toHaveProperty('reviews');
    });

    it('should reject access to other users for non-admin', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const otherUser = await testHelpers.createTestUser({
        email: 'other.user@smarttech.com'
      });
      testUserIds.push(otherUser.id);

      const response = await request(app)
        .get(`/api/v1/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should validate user ID format', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 3: PUT /api/v1/users/:id - Update User Profile
   */
  describe('PUT /api/v1/users/:id - Update User Profile', () => {
    it('should update user first name successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'UpdatedFirstName' })
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe('UpdatedFirstName');
    });

    it('should update user last name successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lastName: 'UpdatedLastName' })
        .expect(200);

      expect(response.body.user.lastName).toBe('UpdatedLastName');
    });

    it('should update user phone number successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '+8801800000002' })
        .expect(200);

      expect(response.body.user.phone).toBe('+8801800000002');
    });

    it('should update user date of birth successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const dob = '1990-01-01';
      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dateOfBirth: dob })
        .expect(200);

      expect(new Date(response.body.user.dateOfBirth).toISOString()).toBe(new Date(dob).toISOString());
    });

    it('should update user gender successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ gender: 'MALE' })
        .expect(200);

      expect(response.body.user.gender).toBe('MALE');
    });

    it('should update multiple fields simultaneously', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const updateData = {
        firstName: 'Multi',
        lastName: 'Update',
        phone: '+8801900000003',
        gender: 'FEMALE'
      };

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
      expect(response.body.user.phone).toBe(updateData.phone);
      expect(response.body.user.gender).toBe(updateData.gender);
    });

    it('should reject duplicate phone number', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser({
        phone: '+8801700000005'
      });
      testUserIds.push(otherUser.id);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: otherUser.phone })
        .expect(409);

      expect(response.body.error).toBe('Phone number already exists');
    });

    it('should allow updating to own phone number', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: regularUser.phone })
        .expect(200);

      expect(response.body.user.phone).toBe(regularUser.phone);
    });

    it('should validate Bangladesh phone number format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const invalidPhones = [
        '123',
        '+880170000000',
        '+88017000000001',
        '+880170000000a',
        'invalid-phone'
      ];

      for (const phone of invalidPhones) {
        await request(app)
          .put(`/api/v1/users/${regularUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ phone })
          .expect(400);
      }
    });

    it('should validate gender values', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ gender: 'INVALID' })
        .expect(400);
    });

    it('should validate date of birth format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ dateOfBirth: 'invalid-date' })
        .expect(400);
    });

    it('should reject empty first name', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: '   ' })
        .expect(400);
    });

    it('should reject empty last name', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lastName: '   ' })
        .expect(400);
    });

    it('should reject non-admin updating other users', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser();
      testUserIds.push(otherUser.id);

      const response = await request(app)
        .put(`/api/v1/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should allow admin to update other users', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'AdminUpdated' })
        .expect(200);

      expect(response.body.user.firstName).toBe('AdminUpdated');
    });

    it('should return 404 for non-existent user', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .put('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .send({ firstName: 'Test' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 4: DELETE /api/v1/users/:id - Delete User
   */
  describe('DELETE /api/v1/users/:id - Delete User', () => {
    let userToDelete;

    beforeEach(async () => {
      userToDelete = await testHelpers.createTestUser({
        email: `delete-${Date.now()}@smarttech.com`
      });
      testUserIds.push(userToDelete.id);
    });

    it('should delete user successfully for admin', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .delete(`/api/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('should reject non-admin from deleting users', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .delete(`/api/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should prevent deletion of users with orders', async () => {
      // Create a user with an order
      const userWithOrder = await testHelpers.createTestUser({
        email: `with-order-${Date.now()}@smarttech.com`
      });
      testUserIds.push(userWithOrder.id);

      // Create an order for the user
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: userWithOrder.id,
          addressId: '00000000-0000-0000-0000-000000000000',
          subtotal: 100,
          tax: 10,
          shippingCost: 20,
          total: 130,
          status: 'pending',
          paymentMethod: 'cash_on_delivery',
          paymentStatus: 'pending'
        }
      });

      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .delete(`/api/v1/users/${userWithOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot delete user with existing orders');
      expect(response.body.suggestion).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should validate user ID format', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      await request(app)
        .delete('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userToDelete.id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 5: GET /api/v1/users/:id/addresses - Get User Addresses
   */
  describe('GET /api/v1/users/:id/addresses - Get User Addresses', () => {
    beforeEach(async () => {
      // Create test addresses for regular user
      await prisma.address.createMany({
        data: [
          {
            userId: regularUser.id,
            firstName: 'Test',
            lastName: 'User',
            phone: '+8801700000001',
            address: '123 Test Street',
            city: 'Dhaka',
            district: 'Dhaka',
            division: 'DHAKA',
            postalCode: '1209',
            isDefault: true,
            type: 'SHIPPING'
          },
          {
            userId: regularUser.id,
            firstName: 'Test',
            lastName: 'User',
            phone: '+8801700000002',
            address: '456 Test Avenue',
            city: 'Chattogram',
            district: 'Chattogram',
            division: 'CHITTAGONG',
            postalCode: '4000',
            isDefault: false,
            type: 'BILLING'
          }
        ]
      });
    });

    it('should get user addresses successfully for self', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('addresses');
      expect(Array.isArray(response.body.addresses)).toBe(true);
      expect(response.body.addresses.length).toBeGreaterThan(0);
    });

    it('should get user addresses successfully for admin', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.addresses.length).toBeGreaterThan(0);
    });

    it('should sort addresses with default first', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      if (response.body.addresses.length > 0) {
        expect(response.body.addresses[0].isDefault).toBe(true);
      }
    });

    it('should reject access to other users addresses', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser();
      testUserIds.push(otherUser.id);

      const response = await request(app)
        .get(`/api/v1/users/${otherUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should validate user ID format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .get('/api/v1/users/invalid-uuid/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/addresses`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 6: POST /api/v1/users/:id/addresses - Create Address
   */
  describe('POST /api/v1/users/:id/addresses - Create Address', () => {
    it('should create new address successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const addressData = {
        type: 'SHIPPING',
        firstName: 'New',
        lastName: 'Address',
        phone: '+8801700000003',
        address: '789 New Street',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        postalCode: '1210',
        isDefault: false
      };

      const response = await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body.message).toBe('Address created successfully');
      expect(response.body.address).toHaveProperty('id');
      expect(response.body.address.firstName).toBe(addressData.firstName);
      expect(response.body.address.lastName).toBe(addressData.lastName);
    });

    it('should set default address and unset others', async () => {
      const userToken = await loginAndGetToken(regularUser);

      // Create first default address
      await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'First',
          lastName: 'Address',
          address: 'First Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          isDefault: true
        });

      // Create second default address
      const response = await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Second',
          lastName: 'Address',
          address: 'Second Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          isDefault: true
        })
        .expect(201);

      // Verify only the new address is default
      const addresses = await prisma.address.findMany({
        where: { userId: regularUser.id }
      });
      const defaultAddresses = addresses.filter(a => a.isDefault);
      expect(defaultAddresses.length).toBe(1);
      expect(defaultAddresses[0].firstName).toBe('Second');
    });

    it('should validate required fields', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const requiredFields = ['firstName', 'lastName', 'address', 'city', 'district'];

      for (const field of requiredFields) {
        const addressData = {
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        };
        delete addressData[field];

        await request(app)
          .post(`/api/v1/users/${regularUser.id}/addresses`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(addressData)
          .expect(400);
      }
    });

    it('should validate Bangladesh phone number', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const invalidPhones = [
        '123',
        '+880170000000',
        '+88017000000001',
        'invalid-phone'
      ];

      for (const phone of invalidPhones) {
        await request(app)
          .post(`/api/v1/users/${regularUser.id}/addresses`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            phone,
            address: 'Test Street',
            city: 'Dhaka',
            district: 'Dhaka',
            division: 'DHAKA'
          })
          .expect(400);
      }
    });

    it('should validate division values', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'INVALID_DIVISION'
        })
        .expect(400);
    });

    it('should validate postal code format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          postalCode: '12345'
        })
        .expect(400);
    });

    it('should validate address type values', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          type: 'INVALID_TYPE'
        })
        .expect(400);
    });

    it('should reject creating address for non-existent user', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const response = await request(app)
        .post('/api/v1/users/00000000-0000-0000-0000-000000000000/addresses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${regularUser.id}/addresses`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 7: PUT /api/v1/users/:id/addresses/:addressId - Update Address
   */
  describe('PUT /api/v1/users/:id/addresses/:addressId - Update Address', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = await prisma.address.create({
        data: {
          userId: regularUser.id,
          firstName: 'Original',
          lastName: 'Address',
          phone: '+8801700000001',
          address: 'Original Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          postalCode: '1209',
          isDefault: false,
          type: 'SHIPPING'
        }
      });
    });

    it('should update address successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Address',
        address: 'Updated Street',
        city: 'Chattogram',
        district: 'Chattogram',
        division: 'CHITTAGONG'
      };

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Address updated successfully');
      expect(response.body.address.firstName).toBe(updateData.firstName);
      expect(response.body.address.city).toBe(updateData.city);
    });

    it('should update partial address fields', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'PartialUpdate' })
        .expect(200);

      expect(response.body.address.firstName).toBe('PartialUpdate');
      expect(response.body.address.lastName).toBe('Address');
    });

    it('should update default address and unset others', async () => {
      const userToken = await loginAndGetToken(regularUser);

      // Create another address
      const otherAddress = await prisma.address.create({
        data: {
          userId: regularUser.id,
          firstName: 'Other',
          lastName: 'Address',
          address: 'Other Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          isDefault: true
        }
      });

      // Update testAddress to default
      await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isDefault: true })
        .expect(200);

      // Verify only testAddress is default
      const addresses = await prisma.address.findMany({
        where: { userId: regularUser.id }
      });
      const defaultAddresses = addresses.filter(a => a.isDefault);
      expect(defaultAddresses.length).toBe(1);
      expect(defaultAddresses[0].id).toBe(testAddress.id);
    });

    it('should reject updating address that belongs to another user', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser();
      testUserIds.push(otherUser.id);

      const otherAddress = await prisma.address.create({
        data: {
          userId: otherUser.id,
          firstName: 'Other',
          lastName: 'Address',
          address: 'Other Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        }
      });

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${otherAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent address', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('Address not found');
    });

    it('should validate address ID format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/invalid-uuid`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Test' })
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .send({ firstName: 'Test' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 8: DELETE /api/v1/users/:id/addresses/:addressId - Delete Address
   */
  describe('DELETE /api/v1/users/:id/addresses/:addressId - Delete Address', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = await prisma.address.create({
        data: {
          userId: regularUser.id,
          firstName: 'Delete',
          lastName: 'Address',
          address: 'Delete Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        }
      });
    });

    it('should delete address successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Address deleted successfully');

      // Verify address is deleted
      const deletedAddress = await prisma.address.findUnique({
        where: { id: testAddress.id }
      });
      expect(deletedAddress).toBeNull();
    });

    it('should reject deleting address that belongs to another user', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser();
      testUserIds.push(otherUser.id);

      const otherAddress = await prisma.address.create({
        data: {
          userId: otherUser.id,
          firstName: 'Other',
          lastName: 'Address',
          address: 'Other Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        }
      });

      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/${otherAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should prevent deletion of address used in orders', async () => {
      const userToken = await loginAndGetToken(regularUser);

      // Create an order that uses this address
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: regularUser.id,
          addressId: testAddress.id,
          subtotal: 100,
          tax: 10,
          shippingCost: 20,
          total: 130,
          status: 'pending',
          paymentMethod: 'cash_on_delivery',
          paymentStatus: 'pending'
        }
      });

      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot delete address that is used in orders');
      expect(response.body.suggestion).toBeDefined();
    });

    it('should return 404 for non-existent address', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error).toBe('Address not found');
    });

    it('should validate address ID format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/invalid-uuid`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}/addresses/${testAddress.id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 9: PUT /api/v1/users/:id/addresses/:addressId/default - Set Default Address
   */
  describe('PUT /api/v1/users/:id/addresses/:addressId/default - Set Default Address', () => {
    let testAddress1, testAddress2;

    beforeEach(async () => {
      testAddress1 = await prisma.address.create({
        data: {
          userId: regularUser.id,
          firstName: 'First',
          lastName: 'Address',
          address: 'First Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          isDefault: true
        }
      });

      testAddress2 = await prisma.address.create({
        data: {
          userId: regularUser.id,
          firstName: 'Second',
          lastName: 'Address',
          address: 'Second Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          isDefault: false
        }
      });
    });

    it('should set default address successfully', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress2.id}/default`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Default address set successfully');
      expect(response.body.address.id).toBe(testAddress2.id);
      expect(response.body.address.isDefault).toBe(true);
    });

    it('should unset previous default address', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress2.id}/default`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify testAddress1 is no longer default
      const address1 = await prisma.address.findUnique({
        where: { id: testAddress1.id }
      });
      expect(address1.isDefault).toBe(false);

      // Verify testAddress2 is now default
      const address2 = await prisma.address.findUnique({
        where: { id: testAddress2.id }
      });
      expect(address2.isDefault).toBe(true);
    });

    it('should reject setting default for another users address', async () => {
      const userToken = await loginAndGetToken(regularUser);
      const otherUser = await testHelpers.createTestUser();
      testUserIds.push(otherUser.id);

      const otherAddress = await prisma.address.create({
        data: {
          userId: otherUser.id,
          firstName: 'Other',
          lastName: 'Address',
          address: 'Other Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        }
      });

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${otherAddress.id}/default`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent address', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/00000000-0000-0000-0000-000000000000/default`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error).toBe('Address not found');
    });

    it('should validate address ID format', async () => {
      const userToken = await loginAndGetToken(regularUser);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/invalid-uuid/default`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}/addresses/${testAddress2.id}/default`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Test Suite 10: Edge Cases and Security
   */
  describe('Edge Cases and Security', () => {
    it('should handle SQL injection attempts', async () => {
      const adminToken = await loginAndGetToken(adminUser);

      const sqlInjection = "'; DROP TABLE users; --";

      await request(app)
        .get(`/api/v1/users?search=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should handle XSS attempts', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: xssPayload })
        .expect(200);

      // Should sanitize the input
      expect(response.body.user.firstName).not.toContain('<script>');
    });

    it('should handle very long input strings', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const longString = 'a'.repeat(1000);

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: longString })
        .expect(200);

      // Should handle or truncate the input
      expect(response.body.user.firstName).toBeDefined();
    });

    it('should handle special characters in input', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const specialChars = 'Test!@#$%^&*()_+-=[]{}|;:",.<>?/~`';

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: specialChars })
        .expect(200);

      expect(response.body.user.firstName).toBeDefined();
    });

    it('should handle Unicode characters', async () => {
      const userToken = await loginAndGetToken(regularUser);

      const unicodeName = 'বাংলাদেশ';

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: unicodeName })
        .expect(200);

      expect(response.body.user.firstName).toBe(unicodeName);
    });

    it('should handle concurrent requests safely', async () => {
      const userToken = await loginAndGetToken(regularUser);

      // Make multiple concurrent requests
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .put(`/api/v1/users/${regularUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ firstName: `Concurrent-${Math.random()}` })
      );

      const responses = await Promise.all(requests);

      // All requests should complete successfully
      responses.forEach(response => {
        expect([200, 400]).toContain(response.status);
      });
    });
  });
});
