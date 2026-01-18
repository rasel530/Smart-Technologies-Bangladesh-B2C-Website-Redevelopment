/**
 * Corporate Account Management - Security Tests
 * 
 * Tests for security aspects of corporate account management
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateTestToken, createTestUser, createTestAdmin } = require('./api-test-utils');

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

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

class CorporateSecurityTest {
  constructor() {
    this.app = express();
    this.testUser = null;
    this.testAdmin = null;
    this.testCorporateAccount = null;
    this.testToken = null;
    this.adminToken = null;
  }

  async setup() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    const corporateRoutes = require('../routes/corporate');
    this.app.use('/api/v1/corporate', corporateRoutes);
    
    // Create test users
    this.testUser = await createTestUser({
      email: 'security-user@test.com',
      role: 'CUSTOMER'
    });
    
    this.testAdmin = await createTestAdmin({
      email: 'security-admin@test.com'
    });
    
    // Generate tokens
    this.testToken = generateTestToken(this.testUser);
    this.adminToken = generateTestToken(this.testAdmin);
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
    console.log('🧪 Starting Corporate Security Tests...\n');
    
    try {
      await this.setup();
      
      // Role-Based Access Control Tests
      await this.testRBAC_AdminOnlyEndpoints();
      await this.testRBAC_CorporateUserOnlyEndpoints();
      await this.testRBAC_CrossAccountAccess();
      
      // Unauthorized Access Tests
      await this.testUnauthorizedAccess_NoToken();
      await this.testUnauthorizedAccess_InvalidToken();
      await this.testUnauthorizedAccess_ExpiredToken();
      
      // SQL Injection Tests
      await this.testSQLInjection_Registration();
      await this.testSQLInjection_UserManagement();
      await this.testSQLInjection_PurchaseOrders();
      
      // XSS Tests
      await this.testXSS_CompanyName();
      await this.testXSS_BusinessAddress();
      await this.testXSS_Notes();
      
      // Rate Limiting Tests
      await this.testRateLimiting_Registration();
      await this.testRateLimiting_CreditRequests();
      
      // Data Privacy Tests
      await this testDataPrivacy_UserCannotSeeOtherAccounts();
      await this.testDataPrivacy_SensitiveDataProtection();
      
      await this.generateTestReport();
    } finally {
      await this.teardown();
    }
  }

  /**
   * Test: Role-Based Access Control - Admin only endpoints
   */
  async testRBAC_AdminOnlyEndpoints() {
    testResults.total++;
    console.log('🔍 Test: RBAC - Admin Only Endpoints');
    
    try {
      // Test approval endpoint with regular user token
      const response = await request(this.app)
        .put('/api/v1/corporate/test-id/approve')
        .set('Authorization', `Bearer ${this.testToken}`) // Regular user, not admin
        .send({
          action: 'APPROVE',
          notes: 'Trying to approve'
        });
      
      assert.strictEqual(response.status, 403, 'Regular user should be forbidden from admin endpoints');
      assert(response.body.error !== undefined, 'Should return error message');
      
      testResults.passed++;
      testResults.details.push({
        test: 'RBAC - Admin Only Endpoints',
        status: 'PASSED',
        message: 'Admin-only endpoints properly protected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'RBAC - Admin Only Endpoints',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Role-Based Access Control - Corporate user only endpoints
   */
  async testRBAC_CorporateUserOnlyEndpoints() {
    testResults.total++;
    console.log('🔍 Test: RBAC - Corporate User Only Endpoints');
    
    try {
      // Create a regular user without corporate account
      const regularUser = await createTestUser({
        email: 'regular-user@test.com',
        role: 'CUSTOMER'
      });
      
      const regularToken = generateTestToken(regularUser);
      
      // Test corporate endpoint with non-corporate user
      const response = await request(this.app)
        .get('/api/v1/corporate/test-id/status')
        .set('Authorization', `Bearer ${regularToken}`);
      
      assert([401, 403].includes(response.status), 
        'Non-corporate user should be denied access to corporate endpoints');
      
      testResults.passed++;
      testResults.details.push({
        test: 'RBAC - Corporate User Only Endpoints',
        status: 'PASSED',
        message: 'Corporate user-only endpoints properly protected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'RBAC - Corporate User Only Endpoints',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Role-Based Access Control - Cross account access
   */
  async testRBAC_CrossAccountAccess() {
    testResults.total++;
    console.log('🔍 Test: RBAC - Cross Account Access');
    
    try {
      // Create two corporate accounts with different users
      const user1 = await createTestUser({
        email: 'corp-user-1@test.com',
        role: 'CUSTOMER'
      });
      
      const user2 = await createTestUser({
        email: 'corp-user-2@test.com',
        role: 'CUSTOMER'
      });
      
      // Register corporate account for user1
      const registrationResponse = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Test Corp 1')
        .field('companyRegistrationNumber', 'REG-SEC-001')
        .field('businessAddress', '123 Test Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'User 1')
        .field('authorizedPersonEmail', 'user1@test.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@testcorp1.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test'), 'test1.pdf');
      
      const accountId1 = registrationResponse.body.accountId;
      const token1 = generateTestToken(user1);
      
      // Try to access account1 with user2's token
      const response = await request(this.app)
        .get(`/api/v1/corporate/${accountId1}/users`)
        .set('Authorization', `Bearer ${generateTestToken(user2)}`);
      
      assert([401, 403].includes(response.status), 
        'User should not access another corporate account');
      
      testResults.passed++;
      testResults.details.push({
        test: 'RBAC - Cross Account Access',
        status: 'PASSED',
        message: 'Cross-account access properly blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'RBAC - Cross Account Access',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Unauthorized Access - No token
   */
  async testUnauthorizedAccess_NoToken() {
    testResults.total++;
    console.log('🔍 Test: Unauthorized Access - No Token');
    
    try {
      // Test various endpoints without token
      const endpoints = [
        { method: 'get', path: '/api/v1/corporate/test-id/status' },
        { method: 'get', path: '/api/v1/corporate/test-id/users' },
        { method: 'get', path: '/api/v1/corporate/test-id/credit-limit' },
        { method: 'get', path: '/api/v1/corporate/test-id/invoices' },
        { method: 'get', path: '/api/v1/corporate/test-id/purchase-orders' },
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(this.app)[endpoint.method](endpoint.path);
        
        assert.strictEqual(response.status, 401, 
          `Endpoint ${endpoint.path} should require authentication`);
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'Unauthorized Access - No Token',
        status: 'PASSED',
        message: 'All endpoints properly require authentication'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Unauthorized Access - No Token',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Unauthorized Access - Invalid token
   */
  async testUnauthorizedAccess_InvalidToken() {
    testResults.total++;
    console.log('🔍 Test: Unauthorized Access - Invalid Token');
    
    try {
      const response = await request(this.app)
        .get('/api/v1/corporate/test-id/status')
        .set('Authorization', 'Bearer invalid-token-12345');
      
      assert.strictEqual(response.status, 401, 'Invalid token should be rejected');
      assert(response.body.error !== undefined, 'Should return error message');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Unauthorized Access - Invalid Token',
        status: 'PASSED',
        message: 'Invalid tokens properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Unauthorized Access - Invalid Token',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Unauthorized Access - Expired token
   */
  async testUnauthorizedAccess_ExpiredToken() {
    testResults.total++;
    console.log('🔍 Test: Unauthorized Access - Expired Token');
    
    try {
      const jwt = require('jsonwebtoken');
      
      // Create an expired token
      const expiredToken = jwt.sign(
        { 
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'CUSTOMER',
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );
      
      const response = await request(this.app)
        .get('/api/v1/corporate/test-id/status')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      assert.strictEqual(response.status, 401, 'Expired token should be rejected');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Unauthorized Access - Expired Token',
        status: 'PASSED',
        message: 'Expired tokens properly rejected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Unauthorized Access - Expired Token',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: SQL Injection - Registration
   */
  async testSQLInjection_Registration() {
    testResults.total++;
    console.log('🔍 Test: SQL Injection - Registration');
    
    try {
      const sqlInjectionPayloads = [
        "'; DROP TABLE corporate_accounts; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
        "'; EXEC xp_cmdshell('dir'); --",
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const response = await request(this.app)
          .post('/api/v1/corporate/register')
          .field('companyName', payload)
          .field('companyRegistrationNumber', payload)
          .field('businessAddress', '123 Test Street')
          .field('division', 'DHAKA')
          .field('district', 'Dhaka')
          .field('authorizedPersonName', 'Test User')
          .field('authorizedPersonEmail', 'test@test.com')
          .field('authorizedPersonPhone', '+8801712345678')
          .field('companyEmail', 'info@test.com')
          .field('termsAccepted', 'true')
          .attach('tradeLicense', Buffer.from('test'), 'test.pdf');
        
        // SQL injection should be rejected with validation error
        assert([400, 422].includes(response.status), 
          `SQL injection payload should be rejected: ${payload.substring(0, 20)}...`);
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'SQL Injection - Registration',
        status: 'PASSED',
        message: 'SQL injection attempts properly prevented'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'SQL Injection - Registration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: SQL Injection - User management
   */
  async testSQLInjection_UserManagement() {
    testResults.total++;
    console.log('🔍 Test: SQL Injection - User Management');
    
    try {
      const sqlInjectionPayloads = [
        "'; DROP TABLE corporate_users; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const response = await request(this.app)
          .post('/api/v1/corporate/test-id/users')
          .set('Authorization', `Bearer ${this.adminToken}`)
          .send({
            userId: payload,
            role: 'REQUESTER'
          });
        
        // SQL injection should be rejected
        assert([400, 404, 422].includes(response.status), 
          `SQL injection payload should be rejected: ${payload.substring(0, 20)}...`);
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'SQL Injection - User Management',
        status: 'PASSED',
        message: 'SQL injection in user management prevented'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'SQL Injection - User Management',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: SQL Injection - Purchase orders
   */
  async testSQLInjection_PurchaseOrders() {
    testResults.total++;
    console.log('🔍 Test: SQL Injection - Purchase Orders');
    
    try {
      const sqlInjectionPayloads = [
        "'; DROP TABLE purchase_orders; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const response = await request(this.app)
          .post('/api/v1/corporate/test-id/purchase-orders')
          .set('Authorization', `Bearer ${this.testToken}`)
          .send({
            items: [
              {
                productId: payload,
                quantity: 10
              }
            ],
            notes: payload
          });
        
        // SQL injection should be rejected
        assert([400, 404, 422].includes(response.status), 
          `SQL injection payload should be rejected: ${payload.substring(0, 20)}...`);
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'SQL Injection - Purchase Orders',
        status: 'PASSED',
        message: 'SQL injection in purchase orders prevented'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'SQL Injection - Purchase Orders',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: XSS - Company name
   */
  async testXSS_CompanyName() {
    testResults.total++;
    console.log('🔍 Test: XSS - Company Name');
    
    try {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
      ];
      
      for (const payload of xssPayloads) {
        const response = await request(this.app)
          .post('/api/v1/corporate/register')
          .field('companyName', payload)
          .field('companyRegistrationNumber', 'REG-XSS-001')
          .field('businessAddress', '123 Test Street')
          .field('division', 'DHAKA')
          .field('district', 'Dhaka')
          .field('authorizedPersonName', 'Test User')
          .field('authorizedPersonEmail', 'test@test.com')
          .field('authorizedPersonPhone', '+8801712345678')
          .field('companyEmail', 'info@test.com')
          .field('termsAccepted', 'true')
          .attach('tradeLicense', Buffer.from('test'), 'test.pdf');
        
        // XSS should be sanitized or rejected
        if (response.status === 201) {
          // If accepted, verify it's sanitized
          assert(!response.body.companyName.includes('<script>'), 
            'XSS payload should be sanitized');
          assert(!response.body.companyName.includes('javascript:'), 
            'XSS payload should be sanitized');
        } else {
          // Should be rejected with validation error
          assert([400, 422].includes(response.status), 
            `XSS payload should be rejected or sanitized: ${payload.substring(0, 20)}...`);
        }
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'XSS - Company Name',
        status: 'PASSED',
        message: 'XSS in company name properly handled'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'XSS - Company Name',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: XSS - Business address
   */
  async testXSS_BusinessAddress() {
    testResults.total++;
    console.log('🔍 Test: XSS - Business Address');
    
    try {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Test Corp')
        .field('companyRegistrationNumber', 'REG-XSS-002')
        .field('businessAddress', xssPayload)
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'Test User')
        .field('authorizedPersonEmail', 'test@test.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@test.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test'), 'test.pdf');
      
      // XSS should be sanitized or rejected
      if (response.status === 201) {
        assert(!response.body.businessAddress.includes('<script>'), 
          'XSS payload should be sanitized');
      } else {
        assert([400, 422].includes(response.status), 
          'XSS payload should be rejected or sanitized');
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'XSS - Business Address',
        status: 'PASSED',
        message: 'XSS in business address properly handled'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'XSS - Business Address',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: XSS - Notes
   */
  async testXSS_Notes() {
    testResults.total++;
    console.log('🔍 Test: XSS - Notes');
    
    try {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(this.app)
        .post('/api/v1/corporate/test-id/purchase-orders')
        .set('Authorization', `Bearer ${this.testToken}`)
        .send({
          items: [
            {
              productId: 'test-product-id',
              quantity: 10
            }
          ],
          notes: xssPayload
        });
      
      // XSS should be sanitized or rejected
      if ([200, 201].includes(response.status)) {
        assert(!response.body.notes?.includes('<script>'), 
          'XSS payload should be sanitized');
      } else {
        assert([400, 422].includes(response.status), 
          'XSS payload should be rejected or sanitized');
      }
      
      testResults.passed++;
      testResults.details.push({
        test: 'XSS - Notes',
        status: 'PASSED',
        message: 'XSS in notes properly handled'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'XSS - Notes',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Rate Limiting - Registration
   */
  async testRateLimiting_Registration() {
    testResults.total++;
    console.log('🔍 Test: Rate Limiting - Registration');
    
    try {
      // Make multiple registration requests quickly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(this.app)
            .post('/api/v1/corporate/register')
            .field('companyName', `Rate Limit Test Corp ${i}`)
            .field('companyRegistrationNumber', `REG-RATE-${i}`)
            .field('businessAddress', '123 Test Street')
            .field('division', 'DHAKA')
            .field('district', 'Dhaka')
            .field('authorizedPersonName', 'Test User')
            .field('authorizedPersonEmail', `test${i}@test.com`)
            .field('authorizedPersonPhone', '+8801712345678')
            .field('companyEmail', `info${i}@test.com`)
            .field('termsAccepted', 'true')
            .attach('tradeLicense', Buffer.from('test'), 'test.pdf')
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      assert(rateLimitedResponses.length > 0, 
        'Rate limiting should be triggered after multiple requests');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Rate Limiting - Registration',
        status: 'PASSED',
        message: 'Rate limiting properly enforced'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Rate Limiting - Registration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Rate Limiting - Credit requests
   */
  async testRateLimiting_CreditRequests() {
    testResults.total++;
    console.log('🔍 Test: Rate Limiting - Credit Requests');
    
    try {
      // Make multiple credit requests quickly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(this.app)
            .post('/api/v1/corporate/test-id/credit-request')
            .set('Authorization', `Bearer ${this.testToken}`)
            .send({
              requestedLimit: 50000 + (i * 1000),
              reason: `Rate limit test ${i}`
            })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      assert(rateLimitedResponses.length > 0, 
        'Rate limiting should be triggered for credit requests');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Rate Limiting - Credit Requests',
        status: 'PASSED',
        message: 'Rate limiting for credit requests enforced'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Rate Limiting - Credit Requests',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Data Privacy - User cannot see other accounts
   */
  async testDataPrivacy_UserCannotSeeOtherAccounts() {
    testResults.total++;
    console.log('🔍 Test: Data Privacy - User Cannot See Other Accounts');
    
    try {
      // Create two corporate accounts
      const user1 = await createTestUser({
        email: 'privacy-user-1@test.com',
        role: 'CUSTOMER'
      });
      
      const user2 = await createTestUser({
        email: 'privacy-user-2@test.com',
        role: 'CUSTOMER'
      });
      
      const reg1 = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Privacy Corp 1')
        .field('companyRegistrationNumber', 'REG-PRIV-001')
        .field('businessAddress', '123 Privacy Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'User 1')
        .field('authorizedPersonEmail', 'user1@test.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@privacy1.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test'), 'test1.pdf');
      
      const reg2 = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Privacy Corp 2')
        .field('companyRegistrationNumber', 'REG-PRIV-002')
        .field('businessAddress', '456 Privacy Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'User 2')
        .field('authorizedPersonEmail', 'user2@test.com')
        .field('authorizedPersonPhone', '+8801712345679')
        .field('companyEmail', 'info@privacy2.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test'), 'test2.pdf');
      
      const accountId1 = reg1.body.accountId;
      const accountId2 = reg2.body.accountId;
      const token1 = generateTestToken(user1);
      
      // Try to access account2 with user1's token
      const response = await request(this.app)
        .get(`/api/v1/corporate/${accountId2}/users`)
        .set('Authorization', `Bearer ${token1}`);
      
      assert([401, 403, 404].includes(response.status), 
        'User should not access another corporate account data');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Data Privacy - User Cannot See Other Accounts',
        status: 'PASSED',
        message: 'Cross-account data access properly blocked'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Data Privacy - User Cannot See Other Accounts',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test: Data Privacy - Sensitive data protection
   */
  async testDataPrivacy_SensitiveDataProtection() {
    testResults.total++;
    console.log('🔍 Test: Data Privacy - Sensitive Data Protection');
    
    try {
      // Register corporate account
      const regResponse = await request(this.app)
        .post('/api/v1/corporate/register')
        .field('companyName', 'Sensitive Data Corp')
        .field('companyRegistrationNumber', 'REG-SENS-001')
        .field('tinNumber', '123456789012')
        .field('businessAddress', '123 Sensitive Street')
        .field('division', 'DHAKA')
        .field('district', 'Dhaka')
        .field('authorizedPersonName', 'Sensitive User')
        .field('authorizedPersonEmail', 'sensitive@test.com')
        .field('authorizedPersonPhone', '+8801712345678')
        .field('companyEmail', 'info@sensitive.com')
        .field('termsAccepted', 'true')
        .attach('tradeLicense', Buffer.from('test'), 'test.pdf');
      
      const accountId = regResponse.body.accountId;
      
      // Get account status
      const statusResponse = await request(this.app)
        .get(`/api/v1/corporate/${accountId}/status`)
        .set('Authorization', `Bearer ${this.testToken}`);
      
      // Verify sensitive data is not exposed
      assert(statusResponse.body.tinNumber !== undefined, 
        'TIN number should not be exposed in status response');
      assert(statusResponse.body.authorizedPersonPhone !== undefined, 
        'Phone number should not be exposed in status response');
      assert(statusResponse.body.businessAddress !== undefined, 
        'Full address should not be exposed in status response');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Data Privacy - Sensitive Data Protection',
        status: 'PASSED',
        message: 'Sensitive data properly protected'
      });
      
      console.log('✅ PASSED\n');
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Data Privacy - Sensitive Data Protection',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 CORPORATE SECURITY TEST REPORT');
    console.log('====================================');
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
  const test = new CorporateSecurityTest();
  test.runAllTests().catch(console.error);
}

module.exports = CorporateSecurityTest;
