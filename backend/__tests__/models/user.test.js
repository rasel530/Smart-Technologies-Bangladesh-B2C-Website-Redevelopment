/**
 * Comprehensive User Model Testing
 * Tests all User model operations, validations, and database interactions
 * 
 * This test suite covers:
 * - User creation and validation
 * - User retrieval and querying
 * - User updates and modifications
 * - User deletion and soft deletion
 * - User relationships and associations
 * - User constraints and uniqueness
 * - User timestamps and audit fields
 */

const { PrismaClient } = require('@prisma/client');
const { TestHelpers } = require('../utils/testHelpers');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('User Model - Comprehensive Testing', () => {
  let testHelpers;
  let testUserIds = [];

  beforeAll(async () => {
    testHelpers = new TestHelpers();
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
   * Test Suite 1: User Creation
   */
  describe('User Creation', () => {
    it('should create user with email successfully', async () => {
      const userData = {
        email: `email-${Date.now()}@smarttech.com`,
        firstName: 'Email',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.status).toBe(userData.status);
      expect(user.emailVerified).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should create user with phone successfully', async () => {
      const userData = {
        phone: '+8801700000001',
        firstName: 'Phone',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.phone).toBe(userData.phone);
      expect(user.phoneVerified).toBeDefined();
    });

    it('should create user with both email and phone', async () => {
      const userData = {
        email: `dual-${Date.now()}@smarttech.com`,
        phone: '+8801800000001',
        firstName: 'Dual',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phoneVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.emailVerified).toBeDefined();
      expect(user.phoneVerified).toBeDefined();
    });

    it('should create user with optional fields', async () => {
      const userData = {
        email: `optional-${Date.now()}@smarttech.com`,
        firstName: 'Optional',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        image: 'https://example.com/image.jpg',
        preferredLanguage: 'bn',
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.dateOfBirth).toEqual(userData.dateOfBirth);
      expect(user.gender).toBe(userData.gender);
      expect(user.image).toBe(userData.image);
      expect(user.preferredLanguage).toBe(userData.preferredLanguage);
    });

    it('should enforce email uniqueness', async () => {
      const email = `unique-${Date.now()}@smarttech.com`;
      
      await prisma.user.create({
        data: {
          email,
          firstName: 'First',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      await expect(
        prisma.user.create({
          data: {
            email,
            firstName: 'Second',
            lastName: 'User',
            password: await bcrypt.hash('Password123!', 10),
            role: 'CUSTOMER',
            status: 'ACTIVE',
            emailVerified: new Date()
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce phone uniqueness', async () => {
      const phone = '+8801900000001';
      
      await prisma.user.create({
        data: {
          phone,
          firstName: 'First',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: new Date()
        }
      });

      await expect(
        prisma.user.create({
          data: {
            phone,
            firstName: 'Second',
            lastName: 'User',
            password: await bcrypt.hash('Password123!', 10),
            role: 'CUSTOMER',
            status: 'ACTIVE',
            phoneVerified: new Date()
          }
        })
      ).rejects.toThrow();
    });

    it('should set default role to customer', async () => {
      const userData = {
        email: `default-role-${Date.now()}@smarttech.com`,
        firstName: 'Default',
        lastName: 'Role',
        password: await bcrypt.hash('Password123!', 10),
        status: 'ACTIVE',
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.role).toBe('customer');
    });

    it('should set default status to active', async () => {
      const userData = {
        email: `default-status-${Date.now()}@smarttech.com`,
        firstName: 'Default',
        lastName: 'Status',
        password: await bcrypt.hash('Password123!', 10),
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.status).toBe('active');
    });

    it('should set default preferredLanguage to en', async () => {
      const userData = {
        email: `default-lang-${Date.now()}@smarttech.com`,
        firstName: 'Default',
        lastName: 'Lang',
        password: await bcrypt.hash('Password123!', 10),
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.preferredLanguage).toBe('en');
    });

    it('should generate UUID for id', async () => {
      const userData = {
        email: `uuid-${Date.now()}@smarttech.com`,
        firstName: 'UUID',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeCreate = new Date();
      
      const userData = {
        email: `timestamp-${Date.now()}@smarttech.com`,
        firstName: 'Timestamp',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should set updatedAt timestamp automatically', async () => {
      const userData = {
        email: `updated-${Date.now()}@smarttech.com`,
        firstName: 'Updated',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        emailVerified: new Date()
      };

      const user = await prisma.user.create({ data: userData });
      testUserIds.push(user.id);

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt).toEqual(user.createdAt);
    });
  });

  /**
   * Test Suite 2: User Retrieval
   */
  describe('User Retrieval', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `retrieve-${Date.now()}@smarttech.com`,
          firstName: 'Retrieve',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      testUserIds.push(testUser.id);
    });

    it('should find user by unique id', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(user).not.toBeNull();
      expect(user.id).toBe(testUser.id);
    });

    it('should find user by unique email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });

      expect(user).not.toBeNull();
      expect(user.email).toBe(testUser.email);
    });

    it('should find user by unique phone', async () => {
      const userWithPhone = await prisma.user.create({
        data: {
          phone: '+8801700000002',
          firstName: 'Phone',
          lastName: 'Retrieve',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: new Date()
        }
      });
      testUserIds.push(userWithPhone.id);

      const user = await prisma.user.findUnique({
        where: { phone: userWithPhone.phone }
      });

      expect(user).not.toBeNull();
      expect(user.phone).toBe(userWithPhone.phone);
    });

    it('should return null for non-existent user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: '00000000-0000-0000-0000-000000000000' }
      });

      expect(user).toBeNull();
    });

    it('should find many users with filtering', async () => {
      const users = await prisma.user.findMany({
        where: { role: 'CUSTOMER' }
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      users.forEach(user => {
        expect(user.role).toBe('CUSTOMER');
      });
    });

    it('should find many users with pagination', async () => {
      const users = await prisma.user.findMany({
        take: 5,
        skip: 0
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeLessThanOrEqual(5);
    });

    it('should find many users with ordering', async () => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });

      expect(Array.isArray(users)).toBe(true);
      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          expect(users[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            users[i + 1].createdAt.getTime()
          );
        }
      }
    });

    it('should find many users with search', async () => {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: 'Retrieve', mode: 'insensitive' } },
            { lastName: { contains: 'Retrieve', mode: 'insensitive' } },
            { email: { contains: 'retrieve', mode: 'insensitive' } }
          ]
        }
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should select specific fields', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('role');
    });

    it('should include related data', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          addresses: true,
          orders: true,
          reviews: true
        }
      });

      expect(user).toHaveProperty('addresses');
      expect(user).toHaveProperty('orders');
      expect(user).toHaveProperty('reviews');
      expect(Array.isArray(user.addresses)).toBe(true);
      expect(Array.isArray(user.orders)).toBe(true);
      expect(Array.isArray(user.reviews)).toBe(true);
    });

    it('should count users', async () => {
      const count = await prisma.user.count();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should count users with filtering', async () => {
      const count = await prisma.user.count({
        where: { role: 'CUSTOMER' }
      });

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 3: User Updates
   */
  describe('User Updates', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `update-${Date.now()}@smarttech.com`,
          firstName: 'Update',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      testUserIds.push(testUser.id);
    });

    it('should update user email', async () => {
      const newEmail = `updated-${Date.now()}@smarttech.com`;
      
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { email: newEmail }
      });

      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        testUser.updatedAt.getTime()
      );
    });

    it('should update user phone', async () => {
      const newPhone = '+8801800000003';
      
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { phone: newPhone }
      });

      expect(updatedUser.phone).toBe(newPhone);
    });

    it('should update user name', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          firstName: 'Updated',
          lastName: 'Name'
        }
      });

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
    });

    it('should update user role', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { role: 'ADMIN' }
      });

      expect(updatedUser.role).toBe('ADMIN');
    });

    it('should update user status', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' }
      });

      expect(updatedUser.status).toBe('INACTIVE');
    });

    it('should update user date of birth', async () => {
      const newDob = new Date('1995-05-15');
      
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { dateOfBirth: newDob }
      });

      expect(updatedUser.dateOfBirth).toEqual(newDob);
    });

    it('should update user gender', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { gender: 'FEMALE' }
      });

      expect(updatedUser.gender).toBe('FEMALE');
    });

    it('should update user image', async () => {
      const newImage = 'https://example.com/new-image.jpg';
      
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { image: newImage }
      });

      expect(updatedUser.image).toBe(newImage);
    });

    it('should update user preferred language', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { preferredLanguage: 'bn' }
      });

      expect(updatedUser.preferredLanguage).toBe('bn');
    });

    it('should update user last login at', async () => {
      const lastLoginAt = new Date();
      
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { lastLoginAt }
      });

      expect(updatedUser.lastLoginAt).toEqual(lastLoginAt);
    });

    it('should update multiple fields simultaneously', async () => {
      const updateData = {
        firstName: 'Multi',
        lastName: 'Update',
        phone: '+8801900000004',
        gender: 'OTHER',
        preferredLanguage: 'bn'
      };

      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: updateData
      });

      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.phone).toBe(updateData.phone);
      expect(updatedUser.gender).toBe(updateData.gender);
      expect(updatedUser.preferredLanguage).toBe(updateData.preferredLanguage);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const originalUpdatedAt = testUser.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { firstName: 'Timestamp' }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(
        prisma.user.update({
          where: { id: '00000000-0000-0000-0000-000000000000' },
          data: { firstName: 'Test' }
        })
      ).rejects.toThrow();
    });

    it('should throw error when violating email uniqueness', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@smarttech.com`,
          firstName: 'Other',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(otherUser.id);

      await expect(
        prisma.user.update({
          where: { id: testUser.id },
          data: { email: otherUser.email }
        })
      ).rejects.toThrow();
    });

    it('should throw error when violating phone uniqueness', async () => {
      const otherUser = await prisma.user.create({
        data: {
          phone: '+8801700000005',
          firstName: 'Other',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          phoneVerified: new Date()
        }
      });
      testUserIds.push(otherUser.id);

      await expect(
        prisma.user.update({
          where: { id: testUser.id },
          data: { phone: otherUser.phone }
        })
      ).rejects.toThrow();
    });

    it('should support upsert operation', async () => {
      const email = `upsert-${Date.now()}@smarttech.com`;
      
      // First upsert should create
      const createdUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: 'Upsert',
          lastName: 'Create',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(createdUser.id);

      expect(createdUser.email).toBe(email);
      expect(createdUser.firstName).toBe('Upsert');

      // Second upsert should update
      const updatedUser = await prisma.user.upsert({
        where: { email },
        update: { firstName: 'Upsert' },
        create: {}
      });

      expect(updatedUser.firstName).toBe('Upsert');
      expect(updatedUser.id).toBe(createdUser.id);
    });
  });

  /**
   * Test Suite 4: User Deletion
   */
  describe('User Deletion', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `delete-${Date.now()}@smarttech.com`,
          firstName: 'Delete',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
    });

    it('should delete user successfully', async () => {
      const deletedUser = await prisma.user.delete({
        where: { id: testUser.id }
      });

      expect(deletedUser.id).toBe(testUser.id);

      // Verify user is deleted
      const user = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(user).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(
        prisma.user.delete({
          where: { id: '00000000-0000-0000-0000-000000000000' }
        })
      ).rejects.toThrow();
    });

    it('should delete user by email', async () => {
      const deletedUser = await prisma.user.delete({
        where: { email: testUser.email }
      });

      expect(deletedUser.email).toBe(testUser.email);
    });

    it('should delete user by phone', async () => {
      const userWithPhone = await prisma.user.create({
        data: {
          phone: '+8801700000006',
          firstName: 'Phone',
          lastName: 'Delete',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          phoneVerified: new Date()
        }
      });
      testUserIds.push(userWithPhone.id);

      const deletedUser = await prisma.user.delete({
        where: { phone: userWithPhone.phone }
      });

      expect(deletedUser.phone).toBe(userWithPhone.phone);
    });

    it('should support deleteMany operation', async () => {
      // Create multiple test users
      const usersToDelete = [];
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `deletemany-${Date.now()}-${i}@smarttech.com`,
            firstName: `Delete${i}`,
            lastName: 'Many',
            password: await bcrypt.hash('Password123!', 10),
            emailVerified: new Date()
          }
        });
        usersToDelete.push(user.id);
        testUserIds.push(user.id);
      }

      const result = await prisma.user.deleteMany({
        where: {
          id: { in: usersToDelete }
        }
      });

      expect(result.count).toBe(3);

      // Verify all users are deleted
      for (const userId of usersToDelete) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        expect(user).toBeNull();
      }
    });
  });

  /**
   * Test Suite 5: User Relationships
   */
  describe('User Relationships', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `relations-${Date.now()}@smarttech.com`,
          firstName: 'Relations',
          lastName: 'User',
          password: await bcrypt.hash('Password123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      testUserIds.push(testUser.id);
    });

    it('should have addresses relationship', async () => {
      const address = await prisma.address.create({
        data: {
          userId: testUser.id,
          firstName: 'Test',
          lastName: 'Address',
          address: 'Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA'
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { addresses: true }
      });

      expect(user.addresses).toHaveLength(1);
      expect(user.addresses[0].id).toBe(address.id);
    });

    it('should have orders relationship', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: testUser.id,
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

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { orders: true }
      });

      expect(user.orders).toHaveLength(1);
      expect(user.orders[0].id).toBe(order.id);
    });

    it('should have reviews relationship', async () => {
      const product = await prisma.product.findFirst();
      
      if (product) {
        const review = await prisma.review.create({
          data: {
            productId: product.id,
            userId: testUser.id,
            rating: 5,
            title: 'Great product',
            comment: 'Excellent quality'
          }
        });

        const user = await prisma.user.findUnique({
          where: { id: testUser.id },
          include: { reviews: true }
        });

        expect(user.reviews).toHaveLength(1);
        expect(user.reviews[0].id).toBe(review.id);
      }
    });

    it('should have emailVerificationTokens relationship', async () => {
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: testUser.id,
          token: 'test-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { emailVerificationTokens: true }
      });

      expect(user.emailVerificationTokens).toHaveLength(1);
      expect(user.emailVerificationTokens[0].id).toBe(token.id);
    });

    it('should have phoneOTPs relationship', async () => {
      const otp = await prisma.phoneOTP.create({
        data: {
          userId: testUser.id,
          phone: '+8801700000007',
          otp: '123456',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { phoneOTPs: true }
      });

      expect(user.phoneOTPs).toHaveLength(1);
      expect(user.phoneOTPs[0].id).toBe(otp.id);
    });

    it('should have userSessions relationship', async () => {
      const session = await prisma.userSession.create({
        data: {
          userId: testUser.id,
          token: 'test-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { userSessions: true }
      });

      expect(user.userSessions).toHaveLength(1);
      expect(user.userSessions[0].id).toBe(session.id);
    });

    it('should have passwordHistory relationship', async () => {
      const passwordHistory = await prisma.passwordHistory.create({
        data: {
          userId: testUser.id,
          passwordHash: 'old-password-hash'
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { passwordHistory: true }
      });

      expect(user.passwordHistory).toHaveLength(1);
      expect(user.passwordHistory[0].id).toBe(passwordHistory.id);
    });

    it('should have socialAccounts relationship', async () => {
      const socialAccount = await prisma.userSocialAccount.create({
        data: {
          userId: testUser.id,
          providerId: 'google-provider-id',
          provider: 'google'
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { socialAccounts: true }
      });

      expect(user.socialAccounts).toHaveLength(1);
      expect(user.socialAccounts[0].id).toBe(socialAccount.id);
    });

    it('should have notificationPreferences relationship', async () => {
      const preferences = await prisma.userNotificationPreferences.create({
        data: {
          userId: testUser.id
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { notificationPreferences: true }
      });

      expect(user.notificationPreferences).not.toBeNull();
      expect(user.notificationPreferences.id).toBe(preferences.id);
    });

    it('should have communicationPreferences relationship', async () => {
      const preferences = await prisma.userCommunicationPreferences.create({
        data: {
          userId: testUser.id
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { communicationPreferences: true }
      });

      expect(user.communicationPreferences).not.toBeNull();
      expect(user.communicationPreferences.id).toBe(preferences.id);
    });

    it('should have privacySettings relationship', async () => {
      const settings = await prisma.userPrivacySettings.create({
        data: {
          userId: testUser.id
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { privacySettings: true }
      });

      expect(user.privacySettings).not.toBeNull();
      expect(user.privacySettings.id).toBe(settings.id);
    });
  });

  /**
   * Test Suite 6: User Constraints and Validation
   */
  describe('User Constraints and Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'invalid@',
        'invalid@.com'
      ];

      for (const email of invalidEmails) {
        await expect(
          prisma.user.create({
            data: {
              email,
              firstName: 'Invalid',
              lastName: 'Email',
              password: await bcrypt.hash('Password123!', 10),
              emailVerified: new Date()
            }
          })
        ).rejects.toThrow();
      }
    });

    it('should validate phone format for Bangladesh', async () => {
      const validPhones = [
        '+8801700000001',
        '+8801800000001',
        '+8801900000001',
        '+8801500000001',
        '+8801300000001',
        '+8801400000001',
        '+8801600000001'
      ];

      for (const phone of validPhones) {
        const user = await prisma.user.create({
          data: {
            phone,
            firstName: 'Valid',
            lastName: 'Phone',
            password: await bcrypt.hash('Password123!', 10),
            phoneVerified: new Date()
          }
        });
        testUserIds.push(user.id);
        expect(user.phone).toBe(phone);
      }
    });

    it('should validate role enum values', async () => {
      const validRoles = ['customer', 'admin', 'manager', 'super_admin', 'support', 'corporate'];

      for (const role of validRoles) {
        const user = await prisma.user.create({
          data: {
            email: `role-${role}-${Date.now()}@smarttech.com`,
            firstName: 'Role',
            lastName: 'Test',
            password: await bcrypt.hash('Password123!', 10),
            role: role.toUpperCase(),
            emailVerified: new Date()
          }
        });
        testUserIds.push(user.id);
        expect(user.role).toBe(role);
      }
    });

    it('should validate status enum values', async () => {
      const validStatuses = ['active', 'inactive', 'suspended', 'pending'];

      for (const status of validStatuses) {
        const user = await prisma.user.create({
          data: {
            email: `status-${status}-${Date.now()}@smarttech.com`,
            firstName: 'Status',
            lastName: 'Test',
            password: await bcrypt.hash('Password123!', 10),
            status: status.toUpperCase(),
            emailVerified: new Date()
          }
        });
        testUserIds.push(user.id);
        expect(user.status).toBe(status);
      }
    });

    it('should validate gender enum values', async () => {
      const validGenders = ['MALE', 'FEMALE', 'OTHER'];

      for (const gender of validGenders) {
        const user = await prisma.user.create({
          data: {
            email: `gender-${gender}-${Date.now()}@smarttech.com`,
            firstName: 'Gender',
            lastName: 'Test',
            password: await bcrypt.hash('Password123!', 10),
            gender,
            emailVerified: new Date()
          }
        });
        testUserIds.push(user.id);
        expect(user.gender).toBe(gender);
      }
    });

    it('should enforce firstName required constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: `no-firstname-${Date.now()}@smarttech.com`,
            lastName: 'NoFirstName',
            password: await bcrypt.hash('Password123!', 10),
            emailVerified: new Date()
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce lastName required constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: `no-lastname-${Date.now()}@smarttech.com`,
            firstName: 'NoLastName',
            password: await bcrypt.hash('Password123!', 10),
            emailVerified: new Date()
          }
        })
      ).rejects.toThrow();
    });

    it('should allow either email or phone', async () => {
      // User with only email
      const emailUser = await prisma.user.create({
        data: {
          email: `email-only-${Date.now()}@smarttech.com`,
          firstName: 'Email',
          lastName: 'Only',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(emailUser.id);
      expect(emailUser.email).toBeDefined();
      expect(emailUser.phone).toBeNull();

      // User with only phone
      const phoneUser = await prisma.user.create({
        data: {
          phone: '+8801700000008',
          firstName: 'Phone',
          lastName: 'Only',
          password: await bcrypt.hash('Password123!', 10),
          phoneVerified: new Date()
        }
      });
      testUserIds.push(phoneUser.id);
      expect(phoneUser.phone).toBeDefined();
      expect(phoneUser.email).toBeNull();
    });
  });

  /**
   * Test Suite 7: User Timestamps and Audit Fields
   */
  describe('User Timestamps and Audit Fields', () => {
    it('should track createdAt timestamp', async () => {
      const beforeCreate = new Date();
      
      const user = await prisma.user.create({
        data: {
          email: `timestamp-${Date.now()}@smarttech.com`,
          firstName: 'Timestamp',
          lastName: 'Test',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(user.id);

      const afterCreate = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should update updatedAt on create', async () => {
      const user = await prisma.user.create({
        data: {
          email: `updatetimestamp-${Date.now()}@smarttech.com`,
          firstName: 'Update',
          lastName: 'Timestamp',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(user.id);

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt).toEqual(user.createdAt);
    });

    it('should update updatedAt on update', async () => {
      const user = await prisma.user.create({
        data: {
          email: `updatefield-${Date.now()}@smarttech.com`,
          firstName: 'Update',
          lastName: 'Field',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(user.id);

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: 'Updated' }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should not update createdAt on update', async () => {
      const user = await prisma.user.create({
        data: {
          email: `createtime-${Date.now()}@smarttech.com`,
          firstName: 'Create',
          lastName: 'Time',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(user.id);

      const originalCreatedAt = user.createdAt;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: 'Updated' }
      });

      expect(updatedUser.createdAt).toEqual(originalCreatedAt);
    });

    it('should handle lastLoginAt field', async () => {
      const user = await prisma.user.create({
        data: {
          email: `lastlogin-${Date.now()}@smarttech.com`,
          firstName: 'LastLogin',
          lastName: 'Test',
          password: await bcrypt.hash('Password123!', 10),
          emailVerified: new Date()
        }
      });
      testUserIds.push(user.id);

      expect(user.lastLoginAt).toBeNull();

      const loginTime = new Date();
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: loginTime }
      });

      expect(updatedUser.lastLoginAt).toEqual(loginTime);
    });
  });
});
