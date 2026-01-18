/**
 * Corporate Account Management - Integration Tests
 * 
 * End-to-end workflow tests for corporate account management
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateTestToken, createTestUser, createTestAdmin, createTestProduct } = require('./api-test-utils');

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

class CorporateIntegrationTest {
  constructor() {
    this.app = express();
    this.testUser = null;
    this.testAdmin = null;
    this.testCorporateAccount = null;
    this.testToken = null;
    this.adminToken = null;
    this.testProduct = null;
  }

  async setup() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    const corporateRoutes = require('../routes/corporate');
    this.app.use('/api/v1/corporate', corporateRoutes);
    
    // Create test users
    this.testUser = await createTestUser({
      email: 'integration-user@test.com',
      role: 'CUSTOMER'
    });
    
    this.testAdmin = await createTestAdmin({
      email: 'integration-admin@test.com'
    });
    
    // Generate tokens
    this.testToken = generateTestToken(this.testUser);
    this.adminToken = generateTestToken(this.testAdmin);
    
    // Create test product
    this.testProduct = await createTestProduct();
  }

  async teardown() {
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
    console.log('🧪 Starting Corporate Integration Tests...\n');
    
    try {
      await this.setup();
      
      await this.testCompleteCorporateRegistrationWorkflow();
      await this.testUserManagementWorkflow();
      await this.testPurchaseOrderCreationAndApprovalWorkflow();
      await this.testCreditRequestAndApprovalWorkflow();
      await this.testInvoiceGenerationAndDownloadWorkflow();
      
      await this.generateTestReport();
    } finally {
      await this.teardown();
    }
  }

  /**
   * Test: Complete corporate registration workflow
   */
  async testCompleteCorporateRegistrationWorkflow() {
    testResults.total++;
    console.log('🔍 Test: Complete Corporate Registration Workflow');
    
    try {
      // Step 1: Register corporate account
      const registrationResponse = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Integration Test Corp')
        .field('companyRegistrationNumber', 'REG-INT-001')
        .field('tinNumber', '123456789012')
        .field('businessAddress', '123 Integration Street, Dhaka')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('upazila', 'Dhaka North')
        .field('postalCode', '1000')
        .field('authorizedPersonName', 'Integration Admin')
        .field('authorizedPersonEmail', 'admin@integration.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@integration.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test document'), 'test-license.pdf');
      
      assert.strictEqual(registrationResponse.status, 201, 'Registration should succeed');
      const accountId = registrationResponse.body.accountId;
      
      // Step 2: Check account status (should be PENDING)
      const statusResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/status`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(statusResponse.status, 200, 'Should retrieve status');
      assert.strictEqual(statusResponse.body.status, 'PENDING', 'Status should be PENDING initially');
      
      // Step 3: Admin approves the account
      const approvalResponse = await request(this.app)
        .put(`/api/v1/corporate/${accountId}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          notes: 'Account verified and approved'
        });
      
      assert.strictEqual(approvalResponse.status, 200, 'Approval should succeed');
      assert.strictEqual(approvalResponse.body.status, 'ACTIVE', 'Status should be ACTIVE after approval');
      
      // Step 4: Verify account is now ACTIVE
      const finalStatusResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/status`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(finalStatusResponse.body.status, 'ACTIVE', 'Final status should be ACTIVE');
      
      this.testCorporateAccount = { ...registrationResponse.body, accountId };
      
      testResults.passed++;
      testResults.details.push({
        test: 'Complete Corporate Registration Workflow',
        status: 'PASSED',
        message: 'Full registration workflow completed successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Complete Corporate Registration Workflow',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: User management workflow (add, update, remove users)
   */
  async testUserManagementWorkflow() {
    testResults.total++;
    console.log('🔍 Test: User Management Workflow');
    
    try {
      if (!this.testCorporateAccount) {
        throw new Error('Corporate account not initialized');
      }
      
      const accountId = this.testCorporateAccount.accountId;
      
      // Step 1: Add a new user to corporate account
      const newUser1 = await createTestUser({
        email: 'corp-user-1@test.com',
        role: 'CUSTOMER'
      });
      
      const addUserResponse = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: newUser1.id,
          role: 'REQUESTER'
        });
      
      assert.strictEqual(addUserResponse.status, 201, 'User addition should succeed');
      assert.strictEqual(addUserResponse.body.role, 'REQUESTER', 'User role should be REQUESTER');
      
      // Step 2: Add another user with different role
      const newUser2 = await createTestUser({
        email: 'corp-user-2@test.com',
        role: 'CUSTOMER'
      });
      
      const addUser2Response = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          userId: newUser2.id,
          role: 'APPROVER'
        });
      
      assert.strictEqual(addUser2Response.status, 201, 'Second user addition should succeed');
      assert.strictEqual(addUser2Response.body.role, 'APPROVER', 'Second user role should be APPROVER');
      
      // Step 3: Get list of users
      const getUsersResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(getUsersResponse.status, 200, 'Should retrieve users list');
      assert(getUsersResponse.body.users.length >= 2, 'Should have at least 2 users');
      
      // Step 4: Update user role
      const updateRoleResponse = await request(this.app)
        .put(`/api/v1/corporate/${accountId}/users/${newUser1.id}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          role: 'APPROVER'
        });
      
      assert.strictEqual(updateRoleResponse.status, 200, 'Role update should succeed');
      assert.strictEqual(updateRoleResponse.body.role, 'APPROVER', 'Role should be updated to APPROVER');
      
      // Step 5: Remove a user
      const removeUserResponse = await request(this.app)
        .delete(`/api/v1/corporate/${accountId}/users/${newUser2.id}`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(removeUserResponse.status, 200, 'User removal should succeed');
      
      // Step 6: Verify user was removed
      const finalUsersResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/users`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      const removedUserExists = finalUsersResponse.body.users.some(u => u.userId === newUser2.id);
      assert.strictEqual(removedUserExists, false, 'Removed user should not be in list');
      
      testResults.passed++;
      testResults.details.push({
        test: 'User Management Workflow',
        status: 'PASSED',
        message: 'User management workflow completed successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'User Management Workflow',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Purchase order creation and approval workflow
   */
  async testPurchaseOrderCreationAndApprovalWorkflow() {
    testResults.total++;
    console.log('🔍 Test: Purchase Order Creation and Approval Workflow');
    
    try {
      if (!this.testCorporateAccount) {
        throw new Error('Corporate account not initialized');
      }
      
      const accountId = this.testCorporateAccount.accountId;
      
      // Step 1: Create a purchase order
      const createPOResponse = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [
            {
              productId: this.testProduct.id,
              quantity: 10
            }
          ],
          notes: 'Integration test purchase order'
        });
      
      assert.strictEqual(createPOResponse.status, 201, 'PO creation should succeed');
      assert.strictEqual(createPOResponse.body.status, 'DRAFT', 'PO status should be DRAFT initially');
      const poId = createPOResponse.body.id;
      
      // Step 2: Get purchase order details
      const getPOResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/purchase-orders/${poId}`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(getPOResponse.status, 200, 'Should retrieve PO details');
      assert.strictEqual(getPOResponse.body.items.length, 1, 'PO should have 1 item');
      
      // Step 3: Approve purchase order as admin
      const approvePOResponse = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/purchase-orders/${poId}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          notes: 'PO approved for testing'
        });
      
      assert.strictEqual(approvePOResponse.status, 200, 'PO approval should succeed');
      assert.strictEqual(approvePOResponse.body.status, 'APPROVED', 'PO status should be APPROVED');
      assert(approvePOResponse.body.approvedAt !== undefined, 'PO should have approval timestamp');
      
      // Step 4: Verify PO status changed
      const finalPOResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/purchase-orders/${poId}`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(finalPOResponse.body.status, 'APPROVED', 'Final PO status should be APPROVED');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Purchase Order Creation and Approval Workflow',
        status: 'PASSED',
        message: 'PO workflow completed successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Purchase Order Creation and Approval Workflow',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Credit request and approval workflow
   */
  async testCreditRequestAndApprovalWorkflow() {
    testResults.total++;
    console.log('🔍 Test: Credit Request and Approval Workflow');
    
    try {
      if (!this.testCorporateAccount) {
        throw new Error('Corporate account not initialized');
      }
      
      const accountId = this.testCorporateAccount.accountId;
      
      // Step 1: Check current credit limit
      const creditLimitResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/credit-limit`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(creditLimitResponse.status, 200, 'Should retrieve credit limit');
      const currentLimit = creditLimitResponse.body.creditLimit;
      
      // Step 2: Request credit increase
      const creditRequestResponse = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/credit-request`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          requestedLimit: currentLimit + 50000,
          reason: 'Integration test credit increase request'
        });
      
      assert.strictEqual(creditRequestResponse.status, 201, 'Credit request should succeed');
      assert.strictEqual(creditRequestResponse.body.status, 'PENDING', 'Request status should be PENDING initially');
      const requestId = creditRequestResponse.body.id;
      
      // Step 3: Get credit history
      const creditHistoryResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/credit-history`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(creditHistoryResponse.status, 200, 'Should retrieve credit history');
      const requestExists = creditHistoryResponse.body.some(r => r.id === requestId);
      assert(requestExists, 'Credit request should be in history');
      
      // Step 4: Admin approves credit request
      const approveCreditResponse = await request(this.app)
        .put(`/api/v1/corporate/${accountId}/credit-request/${requestId}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          approvedAmount: currentLimit + 50000,
          notes: 'Credit increase approved for testing'
        });
      
      assert.strictEqual(approveCreditResponse.status, 200, 'Credit approval should succeed');
      assert.strictEqual(approveCreditResponse.body.status, 'APPROVED', 'Request status should be APPROVED');
      
      // Step 5: Verify credit limit was updated
      const finalCreditLimitResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/credit-limit`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(finalCreditLimitResponse.body.creditLimit, currentLimit + 50000, 
        'Credit limit should be increased');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Credit Request and Approval Workflow',
        status: 'PASSED',
        message: 'Credit workflow completed successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Credit Request and Approval Workflow',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Invoice generation and download workflow
   */
  async testInvoiceGenerationAndDownloadWorkflow() {
    testResults.total++;
    console.log('🔍 Test: Invoice Generation and Download Workflow');
    
    try {
      if (!this.testCorporateAccount) {
        throw new Error('Corporate account not initialized');
      }
      
      const accountId = this.testCorporateAccount.accountId;
      
      // Step 1: Create a purchase order (which will generate invoice)
      const createPOResponse = await request(this.app)
        .post(`/api/v1/corporate/${accountId}/purchase-orders`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [
            {
              productId: this.testProduct.id,
              quantity: 5
            }
          ],
          notes: 'Integration test for invoice generation'
        });
      
      assert.strictEqual(createPOResponse.status, 201, 'PO creation should succeed');
      const poId = createPOResponse.body.id;
      
      // Step 2: Approve the PO to trigger invoice generation
      await request(this.app)
        .post(`/api/v1/corporate/${accountId}/purchase-orders/${poId}/approve`)
        .set('Authorization', `Bearer ${this.adminToken}`)
        .send({
          action: 'APPROVE',
          notes: 'Approve for invoice generation'
        });
      
      // Step 3: Get invoices list
      const invoicesResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/invoices`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(invoicesResponse.status, 200, 'Should retrieve invoices list');
      assert(invoicesResponse.body.invoices.length > 0, 'Should have at least one invoice');
      
      // Find the invoice for this PO
      const invoice = invoicesResponse.body.invoices.find(inv => inv.purchaseOrderId === poId);
      assert(invoice !== undefined, 'Should find invoice for the PO');
      const invoiceId = invoice.id;
      
      // Step 4: Get invoice details
      const getInvoiceResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      assert.strictEqual(getInvoiceResponse.status, 200, 'Should retrieve invoice details');
      assert(getInvoiceResponse.body.invoiceNumber !== undefined, 'Invoice should have invoice number');
      assert(getInvoiceResponse.body.totalAmount !== undefined, 'Invoice should have total amount');
      
      // Step 5: Download invoice PDF
      const downloadResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/invoices/${invoiceId}/download`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      // Should return 200 (success) or 404 (not yet generated)
      assert([200, 404].includes(downloadResponse.status), 
        'Should return 200 or 404 for download');
      
      if (downloadResponse.status === 200) {
        assert(downloadResponse.headers['content-type'], 
          'Response should have content-type header');
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'Invoice Generation and Download Workflow',
        status: 'PASSED',
        message: 'Invoice workflow completed successfully'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Invoice Generation and Download Workflow',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 CORPORATE INTEGRATION TEST REPORT');
    console.log('========================================');
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
  const test = new CorporateIntegrationTest();
  test.runAllTests().catch(console.error);
}

module.exports = CorporateIntegrationTest;
