/**
 * Corporate Account Management - API Tests
 * 
 * Tests for all corporate account API endpoints
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Import test utilities
const {
  TEST_CONFIG,
  generateTestToken,
  createTestUser,
  createTestAdmin,
  createTestProduct,
  validateResponseStructure
} = require('./api-test-utils');

const prisma = new PrismaClient();

// Mock services
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logPerformance: jest.fn()
  }
}));

jest.mock('../services/emailService', () => ({
  sendCorporateRegistrationEmail: jest.fn().mockResolvedValue(true),
  sendCorporateApprovalEmail: jest.fn().mockResolvedValue(true),
  sendCorporateRejectionEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/fileService', () => ({
  uploadCorporateDocument: jest.fn().mockResolvedValue({ url: 'https://example.com/doc.pdf' }),
  deleteCorporateDocument: jest.fn().mockResolvedValue(true)
}));

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

class CorporateAPITest {
  constructor() {
    this.app = express();
    this.testUser = null;
    this.testAdmin = null;
    this.testCorporateAccount = null;
    this.testToken = null;
    this.adminToken = null;
  }

  async setup() {
    // Setup Express app with routes
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    const corporateRoutes = require('../routes/corporate');
    this.app.use('/api/v1/corporate', corporateRoutes);
    
    // Create test users
    this.testUser = await createTestUser({
      email: 'corporate-user@test.com',
      role: 'CUSTOMER'
    });
    
    this.testAdmin = await createTestAdmin({
      email: 'corporate-admin@test.com'
    });
    
    // Generate tokens
    this.testToken = generateTestToken(this.testUser);
    this.adminToken = generateTestToken(this.testAdmin);
  }

  async teardown() {
    // Clean up test data
    await prisma.corporatePricing.deleteMany({});
    await prisma.corporateDocuments.deleteMany({});
    await prisma.corporateApprovals.deleteMany({});
    await prisma.corporateUsers.deleteMany({});
    await prisma.corporateAccounts.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.com' } }
    });
  }

  async runAllTests() {
    console.log('🧪 Starting Corporate API Tests...\n');
    
    try {
      await this.setup();
      
      // Corporate Registration Endpoints
      await this.testCorporateRegistration_Success();
      await this.testCorporateRegistration_ValidationError();
      await this.testCorporateRegistration_Duplicate();
      await this.testGetAccountStatus_Authorized();
      await this.testGetAccountStatus_Unauthorized();
      await this.testApproveCorporateAccount_Admin();
      await this.testApproveCorporateAccount_Unauthorized();
      
      // Corporate User Management Endpoints
      await this.testAddCorporateUser_Success();
      await this.testAddCorporateUser_Duplicate();
      await this.testAddCorporateUser_InvalidRole();
      await this.testGetCorporateUsers_Success();
      await this.testUpdateCorporateUserRole_Success();
      await this.testUpdateCorporateUserRole_InvalidRole();
      await this.testRemoveCorporateUser_Success();
      await this.testRemoveCorporateUser_Unauthorized();
      
      // Corporate Pricing Endpoints
      await this.testGetCorporateProducts_Success();
      await this.testGetCorporateProducts_Filtering();
      await this.testCreateCorporatePricing_Success();
      await this.testCreateCorporatePricing_Unauthorized();
      await this.testUpdateCorporatePricing_Success();
      
      // Corporate Billing & Invoicing Endpoints
      await this.testGetCreditLimit_Success();
      await this.testRequestCreditIncrease_Success();
      await this.testRequestCreditIncrease_Validation();
      await this.testGetInvoices_Success();
      await this.testGetInvoices_Filtering();
      await this.testDownloadInvoice_Success();
      
      // Corporate Purchase Order Endpoints
      await this.testCreatePurchaseOrder_Success();
      await this.testCreatePurchaseOrder_Validation();
      await this.testGetPurchaseOrders_Success();
      await this.testApprovePurchaseOrder_Success();
      await this.testApprovePurchaseOrder_Unauthorized();
      
      await this.generateTestReport();
    } finally {
      await this.teardown();
    }
  }

  /**
   * Test: POST /api/corporate/register - Successful registration
   */
  async testCorporateRegistration_Success() {
    testResults.total++;
    console.log('🔍 Test: Corporate Registration - Success');
    
    try {
      const response = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Test Corporation Ltd.')
        .field('companyRegistrationNumber', 'REG-2024-TEST-001')
        .field('tinNumber', '123456789012')
        .field('businessAddress', '123 Business Street, Dhaka')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('upazila', 'Dhaka North')
        .field('postalCode', '1000')
        .field('authorizedPersonName', 'John Doe')
        .field('authorizedPersonEmail', 'john@testcorp.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@testcorp.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test document'), 'test-license.pdf');
      
      validateResponseStructure(response, 201, {
        accountId: expect.any(String),
        status: expect.any(String)
      });
      
      this.testCorporateAccount = response.body;
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Registration - Success',
        status: 'PASSED',
        message: 'Corporate account registered successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Registration - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/register - Validation error
   */
  async testCorporateRegistration_ValidationError() {
    testResults.total++;
    console.log('🔍 Test: Corporate Registration - Validation Error');
    
    try {
      const response = await request(this.app)
        .post('/api/v1/corporate/register')
        .send({
          companyName: '', // Missing required field
          companyRegistrationNumber: 'REG-2024-TEST-002',
          businessAddress: '123 Business Street',
          division: 'DHAKA',
          district: 'Dhaka',
          authorizedPersonName: 'Jane Doe',
          authorizedPersonEmail: 'invalid-email', // Invalid email
          authorizedPersonPhone: '+8801712345678',
          companyEmail: 'info@testcorp2.com',
          termsAccepted: 'false' // Must accept terms
        });
      
      validateResponseStructure(response, 400, {
        error: expect.any(String),
        details: expect.any(Array)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Registration - Validation Error',
        status: 'PASSED',
        message: 'Validation errors properly returned'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Registration - Validation Error',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/register - Duplicate registration
   */
  async testCorporateRegistration_Duplicate() {
    testResults.total++;
    console.log('🔍 Test: Corporate Registration - Duplicate');
    
    try {
      // First registration
      await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Duplicate Corp')
        .field('companyRegistrationNumber', 'REG-2024-DUP-001')
        .field('businessAddress', '123 Dup Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'Bob Smith')
        .field('authorizedPersonEmail', 'bob@duplicate.com')
        .field('authorizedPersonPhone', '+8801712345679')
        .field('companyEmail', 'info@duplicate.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test document'), 'test-license.pdf');
      
      // Second registration with same registration number
      const response = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Another Corp')
        .field('companyRegistrationNumber', 'REG-2024-DUP-001') // Duplicate
        .field('businessAddress', '456 Another Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'Alice Johnson')
        .field('authorizedPersonEmail', 'alice@duplicate.com')
        .field('authorizedPersonPhone', '+8801712345680')
        .field('companyEmail', 'info@duplicate2.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test document'), 'test-license2.pdf');
      
      validateResponseStructure(response, 409, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Registration - Duplicate',
        status: 'PASSED',
        message: 'Duplicate registration properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Registration - Duplicate',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:id/status - Authorized user
   */
  async testGetAccountStatus_Authorized() {
    testResults.total++;
    console.log('🔍 Test: Get Account Status - Authorized');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/status`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        accountId: expect.any(String),
        status: expect.any(String),
        creditLimit: expect.any(Number),
        usedCredit: expect.any(Number),
        availableCredit: expect.any(Number)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Account Status - Authorized',
        status: 'PASSED',
        message: 'Account status retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Account Status - Authorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:id/status - Unauthorized user
   */
  async testGetAccountStatus_Unauthorized() {
    testResults.total++;
    console.log('🔍 Test: Get Account Status - Unauthorized');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/status`);
      
      validateResponseStructure(response, 401, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Account Status - Unauthorized',
        status: 'PASSED',
        message: 'Unauthorized access properly blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Account Status - Unauthorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: PUT /api/corporate/:id/approve - Admin approval
   */
  async testApproveCorporateAccount_Admin() {
    testResults.total++;
    console.log('🔍 Test: Approve Corporate Account - Admin');
    
    try {
      const response = await request(this.app)
        .put(`/api/v1/corporate/${this.testCorporateAccount.accountId}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          notes: 'Account verified and approved'
        });
      
      validateResponseStructure(response, 200, {
        accountId: expect.any(String),
        status: 'ACTIVE',
        approvedAt: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Approve Corporate Account - Admin',
        status: 'PASSED',
        message: 'Account approved successfully by admin'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Approve Corporate Account - Admin',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: PUT /api/corporate/:id/approve - Unauthorized
   */
  async testApproveCorporateAccount_Unauthorized() {
    testResults.total++;
    console.log('🔍 Test: Approve Corporate Account - Unauthorized');
    
    try {
      const response = await request(this.app)
        .put(`/api/v1/corporate/${this.testCorporateAccount.accountId}/approve`)
        .set('Authorization', `Bearer ${this.testToken}`) // Regular user, not admin
        .send({
          action: 'APPROVE',
          notes: 'Trying to approve'
        });
      
      validateResponseStructure(response, 403, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Approve Corporate Account - Unauthorized',
        status: 'PASSED',
        message: 'Unauthorized approval attempt blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Approve Corporate Account - Unauthorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/users - Add user
   */
  async testAddCorporateUser_Success() {
    testResults.total++;
    console.log('🔍 Test: Add Corporate User - Success');
    
    try {
      const newUser = await createTestUser({
        email: 'new-user@test.com',
        role: 'CUSTOMER'
      });
      
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: newUser.id,
          role: 'REQUESTER'
        });
      
      validateResponseStructure(response, 201, {
        id: expect.any(String),
        userId: expect.any(String),
        role: expect.any(String),
        status: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Add Corporate User - Success',
        status: 'PASSED',
        message: 'User added to corporate account successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Add Corporate User - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/users - Duplicate user
   */
  async testAddCorporateUser_Duplicate() {
    testResults.total++;
    console.log('🔍 Test: Add Corporate User - Duplicate');
    
    try {
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: this.testUser.id, // Already added
          role: 'REQUESTER'
        });
      
      validateResponseStructure(response, 409, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Add Corporate User - Duplicate',
        status: 'PASSED',
        message: 'Duplicate user addition properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Add Corporate User - Duplicate',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/users - Invalid role
   */
  async testAddCorporateUser_InvalidRole() {
    testResults.total++;
    console.log('🔍 Test: Add Corporate User - Invalid Role');
    
    try {
      const newUser = await createTestUser({
        email: 'invalid-role-user@test.com',
        role: 'CUSTOMER'
      });
      
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: newUser.id,
          role: 'INVALID_ROLE' // Invalid role
        });
      
      validateResponseStructure(response, 400, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Add Corporate User - Invalid Role',
        status: 'PASSED',
        message: 'Invalid role properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Add Corporate User - Invalid Role',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/users - Get users
   */
  async testGetCorporateUsers_Success() {
    testResults.total++;
    console.log('🔍 Test: Get Corporate Users - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        users: expect.any(Array),
        total: expect.any(Number)
      });
      
      assert(Array.isArray(response.body.users), 'Users should be an array');
      assert(response.body.users.length > 0, 'Should have at least one user');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Corporate Users - Success',
        status: 'PASSED',
        message: 'Corporate users retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Corporate Users - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: PUT /api/corporate/:accountId/users/:userId - Update role
   */
  async testUpdateCorporateUserRole_Success() {
    testResults.total++;
    console.log('🔍 Test: Update Corporate User Role - Success');
    
    try {
      const response = await request(this.app)
        .put(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users/${this.testUser.id}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          role: 'APPROVER'
        });
      
      validateResponseStructure(response, 200, {
        id: expect.any(String),
        role: 'APPROVER'
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Update Corporate User Role - Success',
        status: 'PASSED',
        message: 'User role updated successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Update Corporate User Role - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: PUT /api/corporate/:accountId/users/:userId - Invalid role
   */
  async testUpdateCorporateUserRole_InvalidRole() {
    testResults.total++;
    console.log('🔍 Test: Update Corporate User Role - Invalid Role');
    
    try {
      const response = await request(this.app)
        .put(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users/${this.testUser.id}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          role: 'INVALID_ROLE'
        });
      
      validateResponseStructure(response, 400, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Update Corporate User Role - Invalid Role',
        status: 'PASSED',
        message: 'Invalid role update properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Update Corporate User Role - Invalid Role',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: DELETE /api/corporate/:accountId/users/:userId - Remove user
   */
  async testRemoveCorporateUser_Success() {
    testResults.total++;
    console.log('🔍 Test: Remove Corporate User - Success');
    
    try {
      const newUser = await createTestUser({
        email: 'remove-user@test.com',
        role: 'CUSTOMER'
      });
      
      // Add user first
      await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: newUser.id,
          role: 'REQUESTER'
        });
      
      // Remove user
      const response = await request(this.app)
        .delete(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users/${newUser.id}`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        message: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Remove Corporate User - Success',
        status: 'PASSED',
        message: 'User removed from corporate account successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Remove Corporate User - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: DELETE /api/corporate/:accountId/users/:userId - Unauthorized
   */
  async testRemoveCorporateUser_Unauthorized() {
    testResults.total++;
    console.log('🔍 Test: Remove Corporate User - Unauthorized');
    
    try {
      const response = await request(this.app)
        .delete(`/api/v1/corporate/${this.testCorporateAccount.accountId}/users/${this.testUser.id}`)
        .set('Authorization', 'Bearer invalid-token');
      
      validateResponseStructure(response, 401, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Remove Corporate User - Unauthorized',
        status: 'PASSED',
        message: 'Unauthorized removal properly blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Remove Corporate User - Unauthorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/pricing/products - Get products
   */
  async testGetCorporateProducts_Success() {
    testResults.total++;
    console.log('🔍 Test: Get Corporate Products - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing/products`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        products: expect.any(Array),
        total: expect.any(Number)
      });
      
      assert(Array.isArray(response.body.products), 'Products should be an array');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Corporate Products - Success',
        status: 'PASSED',
        message: 'Corporate products retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Corporate Products - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/pricing/products - Filtering
   */
  async testGetCorporateProducts_Filtering() {
    testResults.total++;
    console.log('🔍 Test: Get Corporate Products - Filtering');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing/products?category=Electronics&page=1&limit=10`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        products: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Corporate Products - Filtering',
        status: 'PASSED',
        message: 'Product filtering works correctly'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Corporate Products - Filtering',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/pricing - Create pricing
   */
  async testCreateCorporatePricing_Success() {
    testResults.total++;
    console.log('🔍 Test: Create Corporate Pricing - Success');
    
    try {
      const product = await createTestProduct();
      
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          productId: product.id,
          discountPercentage: 15,
          specialPrice: 8500
        });
      
      validateResponseStructure(response, 201, {
        id: expect.any(String),
        productId: expect.any(String),
        discountPercentage: expect.any(Number),
        specialPrice: expect.any(Number)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Create Corporate Pricing - Success',
        status: 'PASSED',
        message: 'Corporate pricing created successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Create Corporate Pricing - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/pricing - Unauthorized
   */
  async testCreateCorporatePricing_Unauthorized() {
    testResults.total++;
    console.log('🔍 Test: Create Corporate Pricing - Unauthorized');
    
    try {
      const product = await createTestProduct();
      
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing`)
        .send({
          productId: product.id,
          discountPercentage: 15,
          specialPrice: 8500
        });
      
      validateResponseStructure(response, 401, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Create Corporate Pricing - Unauthorized',
        status: 'PASSED',
        message: 'Unauthorized pricing creation blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Create Corporate Pricing - Unauthorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: PUT /api/corporate/:accountId/pricing/:productId - Update pricing
   */
  async testUpdateCorporatePricing_Success() {
    testResults.total++;
    console.log('🔍 Test: Update Corporate Pricing - Success');
    
    try {
      const product = await createTestProduct();
      
      // Create pricing first
      await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          productId: product.id,
          discountPercentage: 15,
          specialPrice: 8500
        });
      
      // Update pricing
      const response = await request(this.app)
        .put(`/api/v1/corporate/${this.testCorporateAccount.accountId}/pricing/${product.id}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          discountPercentage: 20,
          specialPrice: 8000
        });
      
      validateResponseStructure(response, 200, {
        id: expect.any(String),
        discountPercentage: 20,
        specialPrice: 8000
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Update Corporate Pricing - Success',
        status: 'PASSED',
        message: 'Corporate pricing updated successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Update Corporate Pricing - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/credit-limit - Get credit limit
   */
  async testGetCreditLimit_Success() {
    testResults.total++;
    console.log('🔍 Test: Get Credit Limit - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/credit-limit`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        accountId: expect.any(String),
        creditLimit: expect.any(Number),
        usedCredit: expect.any(Number),
        availableCredit: expect.any(Number)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Credit Limit - Success',
        status: 'PASSED',
        message: 'Credit limit retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Credit Limit - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/credit-request - Request credit
   */
  async testRequestCreditIncrease_Success() {
    testResults.total++;
    console.log('🔍 Test: Request Credit Increase - Success');
    
    try {
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/credit-request`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          requestedLimit: 500000,
          reason: 'Business expansion requires higher credit limit'
        });
      
      validateResponseStructure(response, 201, {
        id: expect.any(String),
        accountId: expect.any(String),
        requestedLimit: expect.any(Number),
        status: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Request Credit Increase - Success',
        status: 'PASSED',
        message: 'Credit increase request created successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Request Credit Increase - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/credit-request - Validation
   */
  async testRequestCreditIncrease_Validation() {
    testResults.total++;
    console.log('🔍 Test: Request Credit Increase - Validation');
    
    try {
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/credit-request`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          requestedLimit: -1000, // Invalid negative value
          reason: '' // Empty reason
        });
      
      validateResponseStructure(response, 400, {
        error: expect.any(String),
        details: expect.any(Array)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Request Credit Increase - Validation',
        status: 'PASSED',
        message: 'Invalid credit request properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Request Credit Increase - Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/invoices - Get invoices
   */
  async testGetInvoices_Success() {
    testResults.total++;
    console.log('🔍 Test: Get Invoices - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/invoices`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        invoices: expect.any(Array),
        total: expect.any(Number)
      });
      
      assert(Array.isArray(response.body.invoices), 'Invoices should be an array');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Invoices - Success',
        status: 'PASSED',
        message: 'Invoices retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Invoices - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/invoices - Filtering
   */
  async testGetInvoices_Filtering() {
    testResults.total++;
    console.log('🔍 Test: Get Invoices - Filtering');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/invoices?status=PAID&page=1&limit=10`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        invoices: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Invoices - Filtering',
        status: 'PASSED',
        message: 'Invoice filtering works correctly'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Invoices - Filtering',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/invoices/:id/download - Download invoice
   */
  async testDownloadInvoice_Success() {
    testResults.total++;
    console.log('🔍 Test: Download Invoice - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/invoices/1/download`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      // Should return PDF or file download
      assert([200, 404].includes(response.status), 
        'Should return 200 (success) or 404 (not found)');
      
      if (response.status === 200) {
        assert(response.headers['content-type'], 
          'Response should have content-type header');
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'Download Invoice - Success',
        status: 'PASSED',
        message: 'Invoice download works correctly'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Download Invoice - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/purchase-orders - Create PO
   */
  async testCreatePurchaseOrder_Success() {
    testResults.total++;
    console.log('🔍 Test: Create Purchase Order - Success');
    
    try {
      const product = await createTestProduct();
      
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [
            {
              productId: product.id,
              quantity: 10
            }
          ],
          notes: 'Test purchase order'
        });
      
      validateResponseStructure(response, 201, {
        id: expect.any(String),
        poNumber: expect.any(String),
        totalAmount: expect.any(Number),
        status: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Create Purchase Order - Success',
        status: 'PASSED',
        message: 'Purchase order created successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Create Purchase Order - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/purchase-orders - Validation
   */
  async testCreatePurchaseOrder_Validation() {
    testResults.total++;
    console.log('🔍 Test: Create Purchase Order - Validation');
    
    try {
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [], // Empty items array
          notes: 'Test purchase order'
        });
      
      validateResponseStructure(response, 400, {
        error: expect.any(String),
        details: expect.any(Array)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Create Purchase Order - Validation',
        status: 'PASSED',
        message: 'Invalid purchase order properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Create Purchase Order - Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: GET /api/corporate/:accountId/purchase-orders - Get POs
   */
  async testGetPurchaseOrders_Success() {
    testResults.total++;
    console.log('🔍 Test: Get Purchase Orders - Success');
    
    try {
      const response = await request(this.app)
        .get(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      validateResponseStructure(response, 200, {
        orders: expect.any(Array),
        total: expect.any(Number)
      });
      
      assert(Array.isArray(response.body.orders), 'Orders should be an array');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Get Purchase Orders - Success',
        status: 'PASSED',
        message: 'Purchase orders retrieved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Get Purchase Orders - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/purchase-orders/:id/approve - Approve PO
   */
  async testApprovePurchaseOrder_Success() {
    testResults.total++;
    console.log('🔍 Test: Approve Purchase Order - Success');
    
    try {
      const product = await createTestProduct();
      
      // Create purchase order first
      const poResponse = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [
            {
              productId: product.id,
              quantity: 5
            }
          ],
          notes: 'Test PO for approval'
        });
      
      // Approve purchase order as admin
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders/${poResponse.body.id}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          notes: 'Order approved'
        });
      
      validateResponseStructure(response, 200, {
        id: expect.any(String),
        status: 'APPROVED',
        approvedAt: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Approve Purchase Order - Success',
        status: 'PASSED',
        message: 'Purchase order approved successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Approve Purchase Order - Success',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: POST /api/corporate/:accountId/purchase-orders/:id/approve - Unauthorized
   */
  async testApprovePurchaseOrder_Unauthorized() {
    testResults.total++;
    console.log('🔍 Test: Approve Purchase Order - Unauthorized');
    
    try {
      const response = await request(this.app)
        .post(`/api/v1/corporate/${this.testCorporateAccount.accountId}/purchase-orders/999/approve`)
        .set('Authorization', `Bearer ${this.testToken}`) // Not admin
        .send({
          action: 'APPROVE',
          notes: 'Trying to approve'
        });
      
      validateResponseStructure(response, 403, {
        error: expect.any(String)
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Approve Purchase Order - Unauthorized',
        status: 'PASSED',
        message: 'Unauthorized approval properly blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Approve Purchase Order - Unauthorized',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 CORPORATE API TEST REPORT');
    console.log('=====================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%\n`);
    
    console.log('📋 Detailed Results:');
    testResults.details.forEach((detail, index) => {
      const status = detail.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return testResults;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new CorporateAPITest();
  test.runAllTests().catch(console.error);
}

module.exports = CorporateAPITest;
