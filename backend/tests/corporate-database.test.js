/**
 * Corporate Account Management - Database Tests
 * 
 * Tests for corporate account database schema, tables, and relationships
 */

const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

class CorporateDatabaseTest {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async runAllTests() {
    console.log('🧪 Starting Corporate Database Tests...\n');
    
    try {
      await this.testCorporateAccountsTable();
      await this.testCorporateUsersTable();
      await this.testCorporateDocumentsTable();
      await this.testCorporateApprovalsTable();
      await this.testCorporatePricingTable();
      await this.testForeignKeyRelationships();
      await this.testUniqueConstraints();
      await this.testDefaultValues();
      await this testDataIntegrity();
      
      this.generateTestReport();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Test 1: Verify corporate_accounts table exists and has correct structure
   */
  async testCorporateAccountsTable() {
    testResults.total++;
    console.log('🔍 Test 1: Corporate Accounts Table Structure');
    
    try {
      // Check if table exists by attempting to query it
      const result = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'corporate_accounts'
      `;
      
      assert.strictEqual(result.length, 1, 'corporate_accounts table should exist');
      
      // Check required columns
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'corporate_accounts'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'userId', 'companyName', 'companyRegistrationNumber',
        'tinNumber', 'businessAddress', 'division', 'district', 'upazila',
        'postalCode', 'authorizedPersonName', 'authorizedPersonEmail',
        'authorizedPersonPhone', 'companyEmail', 'status', 'creditLimit',
        'usedCredit', 'accountManagerId', 'createdAt', 'updatedAt'
      ];
      
      requiredColumns.forEach(col => {
        assert(columnNames.includes(col), `Column ${col} should exist in corporate_accounts table`);
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Accounts Table Structure',
        status: 'PASSED',
        message: 'Table exists with all required columns'
      });
      
      console.log('✅ PASSED: Corporate accounts table structure correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Accounts Table Structure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 2: Verify corporate_users table exists and has correct structure
   */
  async testCorporateUsersTable() {
    testResults.total++;
    console.log('🔍 Test 2: Corporate Users Table Structure');
    
    try {
      const result = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'corporate_users'
      `;
      
      assert.strictEqual(result.length, 1, 'corporate_users table should exist');
      
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'corporate_users'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'accountId', 'userId', 'role', 'status', 'createdAt', 'updatedAt'
      ];
      
      requiredColumns.forEach(col => {
        assert(columnNames.includes(col), `Column ${col} should exist in corporate_users table`);
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Users Table Structure',
        status: 'PASSED',
        message: 'Table exists with all required columns'
      });
      
      console.log('✅ PASSED: Corporate users table structure correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Users Table Structure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 3: Verify corporate_documents table exists and has correct structure
   */
  async testCorporateDocumentsTable() {
    testResults.total++;
    console.log('🔍 Test 3: Corporate Documents Table Structure');
    
    try {
      const result = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'corporate_documents'
      `;
      
      assert.strictEqual(result.length, 1, 'corporate_documents table should exist');
      
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'corporate_documents'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'accountId', 'documentType', 'fileName', 'fileUrl',
        'fileSize', 'uploadedAt', 'status'
      ];
      
      requiredColumns.forEach(col => {
        assert(columnNames.includes(col), `Column ${col} should exist in corporate_documents table`);
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Documents Table Structure',
        status: 'PASSED',
        message: 'Table exists with all required columns'
      });
      
      console.log('✅ PASSED: Corporate documents table structure correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Documents Table Structure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 4: Verify corporate_approvals table exists and has correct structure
   */
  async testCorporateApprovalsTable() {
    testResults.total++;
    console.log('🔍 Test 4: Corporate Approvals Table Structure');
    
    try {
      const result = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'corporate_approvals'
      `;
      
      assert.strictEqual(result.length, 1, 'corporate_approvals table should exist');
      
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'corporate_approvals'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'accountId', 'requestedBy', 'approvedBy', 'requestType',
        'requestData', 'status', 'notes', 'createdAt', 'updatedAt', 'approvedAt'
      ];
      
      requiredColumns.forEach(col => {
        assert(columnNames.includes(col), `Column ${col} should exist in corporate_approvals table`);
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Approvals Table Structure',
        status: 'PASSED',
        message: 'Table exists with all required columns'
      });
      
      console.log('✅ PASSED: Corporate approvals table structure correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Approvals Table Structure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 5: Verify corporate_pricing table exists and has correct structure
   */
  async testCorporatePricingTable() {
    testResults.total++;
    console.log('🔍 Test 5: Corporate Pricing Table Structure');
    
    try {
      const result = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'corporate_pricing'
      `;
      
      assert.strictEqual(result.length, 1, 'corporate_pricing table should exist');
      
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'corporate_pricing'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'accountId', 'productId', 'discountPercentage',
        'specialPrice', 'validFrom', 'validTo', 'isActive', 'createdAt', 'updatedAt'
      ];
      
      requiredColumns.forEach(col => {
        assert(columnNames.includes(col), `Column ${col} should exist in corporate_pricing table`);
      });
      
      testResults.passed++;
      testResults.details.push({
        test: 'Corporate Pricing Table Structure',
        status: 'PASSED',
        message: 'Table exists with all required columns'
      });
      
      console.log('✅ PASSED: Corporate pricing table structure correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Corporate Pricing Table Structure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 6: Verify foreign key relationships are properly established
   */
  async testForeignKeyRelationships() {
    testResults.total++;
    console.log('🔍 Test 6: Foreign Key Relationships');
    
    try {
      // Check foreign key constraints
      const foreignKeys = await this.prisma.$queryRaw`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('corporate_accounts', 'corporate_users', 'corporate_documents', 'corporate_approvals', 'corporate_pricing')
      `;
      
      // Check corporate_accounts foreign keys
      const accountFKs = foreignKeys.filter(fk => fk.table_name === 'corporate_accounts');
      assert(accountFKs.some(fk => fk.foreign_table_name === 'users' && fk.foreign_column_name === 'id'), 
        'corporate_accounts should have foreign key to users table');
      
      // Check corporate_users foreign keys
      const userFKs = foreignKeys.filter(fk => fk.table_name === 'corporate_users');
      assert(userFKs.some(fk => fk.foreign_table_name === 'corporate_accounts' && fk.foreign_column_name === 'id'), 
        'corporate_users should have foreign key to corporate_accounts table');
      assert(userFKs.some(fk => fk.foreign_table_name === 'users' && fk.foreign_column_name === 'id'), 
        'corporate_users should have foreign key to users table');
      
      // Check corporate_documents foreign keys
      const docFKs = foreignKeys.filter(fk => fk.table_name === 'corporate_documents');
      assert(docFKs.some(fk => fk.foreign_table_name === 'corporate_accounts' && fk.foreign_column_name === 'id'), 
        'corporate_documents should have foreign key to corporate_accounts table');
      
      // Check corporate_approvals foreign keys
      const approvalFKs = foreignKeys.filter(fk => fk.table_name === 'corporate_approvals');
      assert(approvalFKs.some(fk => fk.foreign_table_name === 'corporate_accounts' && fk.foreign_column_name === 'id'), 
        'corporate_approvals should have foreign key to corporate_accounts table');
      
      // Check corporate_pricing foreign keys
      const pricingFKs = foreignKeys.filter(fk => fk.table_name === 'corporate_pricing');
      assert(pricingFKs.some(fk => fk.foreign_table_name === 'corporate_accounts' && fk.foreign_column_name === 'id'), 
        'corporate_pricing should have foreign key to corporate_accounts table');
      assert(pricingFKs.some(fk => fk.foreign_table_name === 'products' && fk.foreign_column_name === 'id'), 
        'corporate_pricing should have foreign key to products table');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Foreign Key Relationships',
        status: 'PASSED',
        message: 'All foreign key relationships properly established'
      });
      
      console.log('✅ PASSED: Foreign key relationships correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Foreign Key Relationships',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 7: Verify unique constraints are working
   */
  async testUniqueConstraints() {
    testResults.total++;
    console.log('🔍 Test 7: Unique Constraints');
    
    try {
      // Check unique constraints
      const uniqueConstraints = await this.prisma.$queryRaw`
        SELECT
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name IN ('corporate_accounts', 'corporate_users', 'corporate_documents', 'corporate_approvals', 'corporate_pricing')
      `;
      
      // corporate_accounts should have unique constraint on companyRegistrationNumber
      assert(uniqueConstraints.some(uc => 
        uc.table_name === 'corporate_accounts' && uc.column_name === 'companyRegistrationNumber'
      ), 'corporate_accounts should have unique constraint on companyRegistrationNumber');
      
      // corporate_users should have unique constraint on (accountId, userId)
      const userUnique = uniqueConstraints.filter(uc => uc.table_name === 'corporate_users');
      assert(userUnique.some(uc => uc.column_name === 'accountId'), 
        'corporate_users should have unique constraint including accountId');
      assert(userUnique.some(uc => uc.column_name === 'userId'), 
        'corporate_users should have unique constraint including userId');
      
      // corporate_pricing should have unique constraint on (accountId, productId)
      const pricingUnique = uniqueConstraints.filter(uc => uc.table_name === 'corporate_pricing');
      assert(pricingUnique.some(uc => uc.column_name === 'accountId'), 
        'corporate_pricing should have unique constraint including accountId');
      assert(pricingUnique.some(uc => uc.column_name === 'productId'), 
        'corporate_pricing should have unique constraint including productId');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Unique Constraints',
        status: 'PASSED',
        message: 'All unique constraints properly defined'
      });
      
      console.log('✅ PASSED: Unique constraints correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Unique Constraints',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 8: Verify default values are set correctly
   */
  async testDefaultValues() {
    testResults.total++;
    console.log('🔍 Test 8: Default Values');
    
    try {
      const columns = await this.prisma.$queryRaw`
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'corporate_accounts'
        AND column_default IS NOT NULL
      `;
      
      // Check default values for corporate_accounts
      const statusColumn = columns.find(c => c.column_name === 'status');
      assert(statusColumn !== undefined, 'status column should have a default value');
      
      const creditLimitColumn = columns.find(c => c.column_name === 'creditLimit');
      assert(creditLimitColumn !== undefined, 'creditLimit column should have a default value');
      
      const usedCreditColumn = columns.find(c => c.column_name === 'usedCredit');
      assert(usedCreditColumn !== undefined, 'usedCredit column should have a default value');
      
      // Check corporate_users default values
      const userColumns = await this.prisma.$queryRaw`
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'corporate_users'
        AND column_default IS NOT NULL
      `;
      
      const userStatusColumn = userColumns.find(c => c.column_name === 'status');
      assert(userStatusColumn !== undefined, 'status column in corporate_users should have a default value');
      
      // Check corporate_pricing default values
      const pricingColumns = await this.prisma.$queryRaw`
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'corporate_pricing'
        AND column_default IS NOT NULL
      `;
      
      const isActiveColumn = pricingColumns.find(c => c.column_name === 'isActive');
      assert(isActiveColumn !== undefined, 'isActive column in corporate_pricing should have a default value');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Default Values',
        status: 'PASSED',
        message: 'All default values properly set'
      });
      
      console.log('✅ PASSED: Default values correct\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Default Values',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  /**
   * Test 9: Verify data integrity across tables
   */
  async testDataIntegrity() {
    testResults.total++;
    console.log('🔍 Test 9: Data Integrity');
    
    try {
      // Check that status values are valid enums
      const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];
      
      const statusCheck = await this.prisma.$queryRaw`
        SELECT DISTINCT status
        FROM corporate_accounts
        WHERE status IS NOT NULL
      `;
      
      statusCheck.forEach(row => {
        assert(validStatuses.includes(row.status), 
          `Invalid status value: ${row.status}`);
      });
      
      // Check that credit values are non-negative
      const creditCheck = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM corporate_accounts
        WHERE creditLimit < 0 OR usedCredit < 0
      `;
      
      assert.strictEqual(parseInt(creditCheck[0].count), 0, 
        'Credit values should be non-negative');
      
      // Check that usedCredit does not exceed creditLimit
      const creditLimitCheck = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM corporate_accounts
        WHERE usedCredit > creditLimit
      `;
      
      assert.strictEqual(parseInt(creditLimitCheck[0].count), 0, 
        'Used credit should not exceed credit limit');
      
      testResults.passed++;
      testResults.details.push({
        test: 'Data Integrity',
        status: 'PASSED',
        message: 'Data integrity checks passed'
      });
      
      console.log('✅ PASSED: Data integrity verified\n');
      
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        test: 'Data Integrity',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 CORPORATE DATABASE TEST REPORT');
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
  const test = new CorporateDatabaseTest();
  test.runAllTests().catch(console.error);
}

module.exports = CorporateDatabaseTest;
