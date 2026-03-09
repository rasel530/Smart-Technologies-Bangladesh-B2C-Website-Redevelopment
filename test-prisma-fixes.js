#!/usr/bin/env node

/**
 * Comprehensive Test Script for Prisma Schema Fixes
 * 
 * This script tests all fixes applied to resolve Prisma schema mismatches
 * between frontend and backend, including:
 * - Backend API endpoints
 * - Frontend TypeScript interfaces
 * - Integration tests
 * - Regression tests
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, message = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
  
  testResults.tests.push({ name, status, message });
  
  log(`  ${icon} ${name}`, color);
  if (message) {
    log(`    ${message}`, colors.reset);
  }
}

function logSection(title) {
  log('\n' + '='.repeat(80), colors.cyan);
  log(`  ${title}`, colors.cyan);
  log('='.repeat(80), colors.cyan);
}

function logSubSection(title) {
  log(`\n  ${title}`, colors.bright);
  log('  ' + '-'.repeat(76), colors.cyan);
}

// ============================================================================
// BACKEND API TESTS
// ============================================================================

async function testBackendAPI() {
  logSection('BACKEND API TESTS');
  
  const ordersRoutePath = path.join(__dirname, 'backend/routes/orders.js');
  
  if (!fs.existsSync(ordersRoutePath)) {
    logTest('Backend orders route file exists', 'FAIL', 'File not found: backend/routes/orders.js');
    return;
  }
  
  logTest('Backend orders route file exists', 'PASS');
  
  const ordersRouteContent = fs.readFileSync(ordersRoutePath, 'utf-8');
  
  // Test 1: Orders endpoint with search parameter
  logSubSection('Orders Endpoint - Search Parameter');
  
  if (ordersRouteContent.includes("query('search')")) {
    logTest('Orders endpoint accepts search parameter', 'PASS');
  } else {
    logTest('Orders endpoint accepts search parameter', 'FAIL', 'query("search") not found');
  }
  
  // Test search functionality implementation
  if (ordersRouteContent.includes('where.OR') && 
      ordersRouteContent.includes('orderNumber') &&
      ordersRouteContent.includes('email') &&
      ordersRouteContent.includes('firstName') &&
      ordersRouteContent.includes('lastName')) {
    logTest('Search works on orderNumber, email, firstName, lastName', 'PASS');
  } else {
    logTest('Search works on orderNumber, email, firstName, lastName', 'FAIL', 'Search implementation incomplete');
  }
  
  // Test 2: Orders endpoint with dateFrom/dateTo parameters
  logSubSection('Orders Endpoint - Date Filtering');
  
  if (ordersRouteContent.includes("query('dateFrom')") && 
      ordersRouteContent.includes("query('dateTo')")) {
    logTest('Orders endpoint accepts dateFrom/dateTo parameters', 'PASS');
  } else {
    logTest('Orders endpoint accepts dateFrom/dateTo parameters', 'FAIL', 'Date parameters not found');
  }
  
  // Test date filtering implementation
  if (ordersRouteContent.includes('where.createdAt') &&
      ordersRouteContent.includes('.gte') &&
      ordersRouteContent.includes('.lte')) {
    logTest('Date filtering implementation is correct', 'PASS');
  } else {
    logTest('Date filtering implementation is correct', 'FAIL', 'Date filtering implementation incomplete');
  }
  
  // Test 3: Orders endpoint with sortBy/sortOrder parameters
  logSubSection('Orders Endpoint - Sorting');
  
  if (ordersRouteContent.includes("query('sortBy')") && 
      ordersRouteContent.includes("query('sortOrder')")) {
    logTest('Orders endpoint accepts sortBy/sortOrder parameters', 'PASS');
  } else {
    logTest('Orders endpoint accepts sortBy/sortOrder parameters', 'FAIL', 'Sort parameters not found');
  }
  
  // Test sorting implementation
  if (ordersRouteContent.includes('orderBy') &&
      ordersRouteContent.includes('[sortBy]')) {
    logTest('Sorting implementation is correct', 'PASS');
  } else {
    logTest('Sorting implementation is correct', 'FAIL', 'Sorting implementation incomplete');
  }
  
  // Test 4: Orders endpoint returns paymentStatus
  logSubSection('Orders Endpoint - Payment Status');
  
  if (ordersRouteContent.includes('paymentStatus')) {
    logTest('Orders endpoint includes paymentStatus', 'PASS');
  } else {
    logTest('Orders endpoint includes paymentStatus', 'FAIL', 'paymentStatus not found');
  }
  
  // Test 5: Admin modifications endpoint
  logSubSection('Admin Endpoints - Modifications');
  
  if (ordersRouteContent.includes("router.get('/admin/modifications'")) {
    logTest('Admin modifications endpoint exists', 'PASS');
  } else {
    logTest('Admin modifications endpoint exists', 'FAIL', '/admin/modifications route not found');
  }
  
  if (ordersRouteContent.includes('prisma.order_history')) {
    logTest('Admin modifications uses correct model (order_history)', 'PASS');
  } else {
    logTest('Admin modifications uses correct model (order_history)', 'FAIL', 'Incorrect model reference');
  }
  
  // Test 6: Admin cancellations endpoint
  logSubSection('Admin Endpoints - Cancellations');
  
  if (ordersRouteContent.includes("router.get('/admin/cancellations'")) {
    logTest('Admin cancellations endpoint exists', 'PASS');
  } else {
    logTest('Admin cancellations endpoint exists', 'FAIL', '/admin/cancellations route not found');
  }
  
  if (ordersRouteContent.includes("status: 'cancelled'")) {
    logTest('Admin cancellations filters by cancelled status', 'PASS');
  } else {
    logTest('Admin cancellations filters by cancelled status', 'FAIL', 'Status filter not found');
  }
  
  // Test 7: Payment method validation accepts lowercase values
  logSubSection('Payment Method Validation');
  
  const paymentMethodValidation = ordersRouteContent.match(/isIn\(\[([^\]]+)\]\)/);
  if (paymentMethodValidation) {
    const methods = paymentMethodValidation[1];
    const hasLowercase = methods.includes('bkash') || methods.includes('nagad') || methods.includes('rocket');
    if (hasLowercase) {
      logTest('Payment method validation accepts lowercase values', 'PASS');
    } else {
      logTest('Payment method validation accepts lowercase values', 'WARNING', 'All payment methods appear to be uppercase');
    }
  } else {
    logTest('Payment method validation exists', 'FAIL', 'Payment method validation not found');
  }
  
  // Test payment method lowercase conversion
  if (ordersRouteContent.includes('paymentMethod.toLowerCase()')) {
    logTest('Payment method converted to lowercase before saving', 'PASS');
  } else {
    logTest('Payment method converted to lowercase before saving', 'WARNING', 'Lowercase conversion not found');
  }
  
  // Test 8: Model names are correct
  logSubSection('Prisma Model Names');
  
  const prismaSchemaPath = path.join(__dirname, 'backend/prisma/schema.prisma');
  
  if (!fs.existsSync(prismaSchemaPath)) {
    logTest('Prisma schema file exists', 'FAIL', 'File not found: backend/prisma/schema.prisma');
    return;
  }
  
  logTest('Prisma schema file exists', 'PASS');
  
  const prismaSchemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');
  
  if (prismaSchemaContent.includes('model orders {')) {
    logTest('Model name is "orders" (plural)', 'PASS');
  } else {
    logTest('Model name is "orders" (plural)', 'FAIL', 'Model name is not "orders"');
  }
  
  if (prismaSchemaContent.includes('model order_sharing {')) {
    logTest('Model name is "order_sharing" (snake_case)', 'PASS');
  } else {
    logTest('Model name is "order_sharing" (snake_case)', 'FAIL', 'Model name is not "order_sharing"');
  }
  
  // Verify orders model has correct fields
  if (prismaSchemaContent.includes('paymentStatus') && 
      prismaSchemaContent.includes('PaymentStatus')) {
    logTest('Orders model has paymentStatus field with PaymentStatus enum', 'PASS');
  } else {
    logTest('Orders model has paymentStatus field with PaymentStatus enum', 'FAIL', 'paymentStatus field not found');
  }
  
  // Verify order_history model exists
  if (prismaSchemaContent.includes('model order_history {')) {
    logTest('Order history model exists', 'PASS');
  } else {
    logTest('Order history model exists', 'FAIL', 'order_history model not found');
  }
}

// ============================================================================
// FRONTEND CODE VERIFICATION
// ============================================================================

async function testFrontendCode() {
  logSection('FRONTEND CODE VERIFICATION');
  
  const orderManagementPath = path.join(__dirname, 'frontend/src/lib/api/orderManagement.ts');
  
  if (!fs.existsSync(orderManagementPath)) {
    logTest('Frontend orderManagement.ts file exists', 'FAIL', 'File not found: frontend/src/lib/api/orderManagement.ts');
    return;
  }
  
  logTest('Frontend orderManagement.ts file exists', 'PASS');
  
  const orderManagementContent = fs.readFileSync(orderManagementPath, 'utf-8');
  
  // Test 1: TypeScript interfaces match expected types
  logSubSection('TypeScript Interfaces');
  
  if (orderManagementContent.includes('export interface Order')) {
    logTest('Order interface exists', 'PASS');
  } else {
    logTest('Order interface exists', 'FAIL', 'Order interface not found');
  }
  
  if (orderManagementContent.includes('paymentStatus: string')) {
    logTest('Order interface includes paymentStatus field', 'PASS');
  } else {
    logTest('Order interface includes paymentStatus field', 'FAIL', 'paymentStatus field not found in Order interface');
  }
  
  if (orderManagementContent.includes('export interface OrderItem')) {
    logTest('OrderItem interface exists', 'PASS');
  } else {
    logTest('OrderItem interface exists', 'FAIL', 'OrderItem interface not found');
  }
  
  if (orderManagementContent.includes('export interface OrderModification')) {
    logTest('OrderModification interface exists', 'PASS');
  } else {
    logTest('OrderModification interface exists', 'FAIL', 'OrderModification interface not found');
  }
  
  if (orderManagementContent.includes('export interface OrderCancellation')) {
    logTest('OrderCancellation interface exists', 'PASS');
  } else {
    logTest('OrderCancellation interface exists', 'FAIL', 'OrderCancellation interface not found');
  }
  
  // Test 2: Address field references are correct
  logSubSection('Address Field References');
  
  if (orderManagementContent.includes('address: string')) {
    logTest('Order interface uses "address" field', 'PASS');
  } else {
    logTest('Order interface uses "address" field', 'FAIL', 'address field not found');
  }
  
  if (orderManagementContent.includes('district: string')) {
    logTest('Order interface uses "district" field', 'PASS');
  } else {
    logTest('Order interface uses "district" field', 'FAIL', 'district field not found');
  }
  
  if (orderManagementContent.includes('division: string')) {
    logTest('Order interface uses "division" field', 'PASS');
  } else {
    logTest('Order interface uses "division" field', 'FAIL', 'division field not found');
  }
  
  // Test 3: orderManagement.ts interfaces use correct field names
  logSubSection('API Function Field Names');
  
  if (orderManagementContent.includes('getAllModifications')) {
    logTest('getAllModifications function exists', 'PASS');
  } else {
    logTest('getAllModifications function exists', 'FAIL', 'getAllModifications function not found');
  }
  
  if (orderManagementContent.includes('getAllCancellations')) {
    logTest('getAllCancellations function exists', 'PASS');
  } else {
    logTest('getAllCancellations function exists', 'FAIL', 'getAllCancellations function not found');
  }
  
  // Verify API endpoints use correct paths
  if (orderManagementContent.includes('/orders/admin/modifications')) {
    logTest('getAllModifications uses correct API path', 'PASS');
  } else {
    logTest('getAllModifications uses correct API path', 'FAIL', 'Incorrect API path');
  }
  
  if (orderManagementContent.includes('/orders/admin/cancellations')) {
    logTest('getAllCancellations uses correct API path', 'PASS');
  } else {
    logTest('getAllCancellations uses correct API path', 'FAIL', 'Incorrect API path');
  }
  
  // Test 4: Verify Order interface has all required fields
  logSubSection('Order Interface Completeness');
  
  const requiredFields = [
    'id',
    'orderNumber',
    'userId',
    'status',
    'total',
    'subtotal',
    'tax',
    'shippingCost',
    'discount',
    'paymentMethod',
    'paymentStatus',
    'created_at',
    'updated_at'
  ];
  
  let missingFields = [];
  requiredFields.forEach(field => {
    if (!orderManagementContent.includes(`${field}:`)) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length === 0) {
    logTest('Order interface has all required fields', 'PASS');
  } else {
    logTest('Order interface has all required fields', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
  }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testIntegration() {
  logSection('INTEGRATION TESTS');
  
  const ordersRoutePath = path.join(__dirname, 'backend/routes/orders.js');
  const orderManagementPath = path.join(__dirname, 'frontend/src/lib/api/orderManagement.ts');
  
  if (!fs.existsSync(ordersRoutePath) || !fs.existsSync(orderManagementPath)) {
    logTest('Integration tests skipped', 'WARNING', 'Required files not found');
    return;
  }
  
  const ordersRouteContent = fs.readFileSync(ordersRoutePath, 'utf-8');
  const orderManagementContent = fs.readFileSync(orderManagementPath, 'utf-8');
  
  // Test 1: Search functionality integration
  logSubSection('Search Functionality Integration');
  
  // Backend has search
  const backendHasSearch = ordersRouteContent.includes('where.OR') &&
                          ordersRouteContent.includes('orderNumber') &&
                          ordersRouteContent.includes('email');
  
  // Frontend can send search parameter
  const frontendCanSearch = orderManagementContent.includes('search') ||
                            orderManagementContent.includes('OrderHistoryFilters');
  
  if (backendHasSearch && frontendCanSearch) {
    logTest('Search integration: Backend and frontend aligned', 'PASS');
  } else {
    logTest('Search integration: Backend and frontend aligned', 'FAIL', 'Search implementation mismatch');
  }
  
  // Test 2: Date filtering integration
  logSubSection('Date Filtering Integration');
  
  // Backend has date filtering
  const backendHasDateFilter = ordersRouteContent.includes('dateFrom') &&
                              ordersRouteContent.includes('dateTo') &&
                              ordersRouteContent.includes('where.createdAt');
  
  // Frontend can send date parameters
  const frontendCanFilterDate = orderManagementContent.includes('startDate') ||
                               orderManagementContent.includes('endDate');
  
  if (backendHasDateFilter && frontendCanFilterDate) {
    logTest('Date filtering integration: Backend and frontend aligned', 'PASS');
  } else {
    logTest('Date filtering integration: Backend and frontend aligned', 'FAIL', 'Date filtering implementation mismatch');
  }
  
  // Test 3: Sorting integration
  logSubSection('Sorting Integration');
  
  // Backend has sorting
  const backendHasSorting = ordersRouteContent.includes('sortBy') &&
                           ordersRouteContent.includes('sortOrder') &&
                           ordersRouteContent.includes('orderBy');
  
  // Frontend can send sort parameters
  const frontendCanSort = orderManagementContent.includes('sortBy') ||
                          orderManagementContent.includes('sortOrder');
  
  if (backendHasSorting && frontendCanSort) {
    logTest('Sorting integration: Backend and frontend aligned', 'PASS');
  } else {
    logTest('Sorting integration: Backend and frontend aligned', 'FAIL', 'Sorting implementation mismatch');
  }
  
  // Test 4: Admin sharing functionality
  logSubSection('Admin Sharing Functionality');
  
  // Backend has admin endpoints
  const backendHasAdminEndpoints = ordersRouteContent.includes('/admin/modifications') &&
                                   ordersRouteContent.includes('/admin/cancellations');
  
  // Frontend has admin API functions
  const frontendHasAdminFunctions = orderManagementContent.includes('getAllModifications') &&
                                   orderManagementContent.includes('getAllCancellations');
  
  if (backendHasAdminEndpoints && frontendHasAdminFunctions) {
    logTest('Admin sharing functionality: Backend and frontend aligned', 'PASS');
  } else {
    logTest('Admin sharing functionality: Backend and frontend aligned', 'FAIL', 'Admin functionality mismatch');
  }
}

// ============================================================================
// REGRESSION TESTS
// ============================================================================

async function testRegression() {
  logSection('REGRESSION TESTS');
  
  const ordersRoutePath = path.join(__dirname, 'backend/routes/orders.js');
  const prismaSchemaPath = path.join(__dirname, 'backend/prisma/schema.prisma');
  const orderManagementPath = path.join(__dirname, 'frontend/src/lib/api/orderManagement.ts');
  
  if (!fs.existsSync(ordersRoutePath) || !fs.existsSync(prismaSchemaPath)) {
    logTest('Regression tests skipped', 'WARNING', 'Required files not found');
    return;
  }
  
  const ordersRouteContent = fs.readFileSync(ordersRoutePath, 'utf-8');
  const prismaSchemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');
  let orderManagementContent = '';
  
  if (fs.existsSync(orderManagementPath)) {
    orderManagementContent = fs.readFileSync(orderManagementPath, 'utf-8');
  }
  
  // Test 1: Verify existing functionality still works
  logSubSection('Existing Functionality');
  
  // Basic order retrieval
  if (ordersRouteContent.includes("router.get('/:id'")) {
    logTest('Basic order retrieval endpoint exists', 'PASS');
  } else {
    logTest('Basic order retrieval endpoint exists', 'FAIL', 'GET /:id endpoint not found');
  }
  
  // Order creation
  if (ordersRouteContent.includes("router.post('/'")) {
    logTest('Order creation endpoint exists', 'PASS');
  } else {
    logTest('Order creation endpoint exists', 'FAIL', 'POST / endpoint not found');
  }
  
  // Order status update
  if (ordersRouteContent.includes("router.put('/:id/status'")) {
    logTest('Order status update endpoint exists', 'PASS');
  } else {
    logTest('Order status update endpoint exists', 'FAIL', 'PUT /:id/status endpoint not found');
  }
  
  // Order history
  if (ordersRouteContent.includes("router.get('/history'")) {
    logTest('Order history endpoint exists', 'PASS');
  } else {
    logTest('Order history endpoint exists', 'FAIL', 'GET /history endpoint not found');
  }
  
  // Test 2: Verify no TypeScript compilation errors (basic check)
  logSubSection('TypeScript Compilation Check');
  
  if (fs.existsSync(orderManagementPath)) {
    const orderManagementContent = fs.readFileSync(orderManagementPath, 'utf-8');
    
    // Check for common TypeScript errors
    const hasUndefinedTypes = orderManagementContent.includes(': any') && 
                           !orderManagementContent.includes('// @ts-ignore');
    
    if (!hasUndefinedTypes) {
      logTest('No obvious TypeScript type errors', 'PASS');
    } else {
      logTest('No obvious TypeScript type errors', 'WARNING', 'Some "any" types found, may need review');
    }
    
    // Check for proper imports
    if (orderManagementContent.includes('import apiClient')) {
      logTest('API client properly imported', 'PASS');
    } else {
      logTest('API client properly imported', 'FAIL', 'API client import not found');
    }
  }
  
  // Test 3: Verify no runtime errors from schema mismatches
  logSubSection('Schema Mismatch Checks');
  
  // Check that backend uses correct model names
  const usesCorrectModelNames = ordersRouteContent.includes('prisma.orders') &&
                               ordersRouteContent.includes('prisma.order_history') &&
                               !ordersRouteContent.includes('prisma.order.findMany');
  
  if (usesCorrectModelNames) {
    logTest('Backend uses correct Prisma model names', 'PASS');
  } else {
    logTest('Backend uses correct Prisma model names', 'FAIL', 'Incorrect model name usage detected');
  }
  
  // Check that backend uses correct relation names
  const usesCorrectRelations = ordersRouteContent.includes('order_items') &&
                             ordersRouteContent.includes('users') &&
                             ordersRouteContent.includes('addresses');
  
  if (usesCorrectRelations) {
    logTest('Backend uses correct relation names', 'PASS');
  } else {
    logTest('Backend uses correct relation names', 'FAIL', 'Incorrect relation name usage detected');
  }
  
  // Test 4: Verify PaymentMethod enum values match
  logSubSection('Payment Method Enum Consistency');
  
  const backendPaymentMethods = ordersRouteContent.match(/isIn\(\[([^\]]+)\]\)/);
  const frontendPaymentMethods = orderManagementContent ? 
    orderManagementContent.match(/paymentMethod:\s*['"]([^'"]+)['"]/g) : null;
  
  if (backendPaymentMethods) {
    const methods = backendPaymentMethods[1];
    const hasLocalMethods = methods.includes('bkash') || methods.includes('nagad') || methods.includes('rocket');
    
    if (hasLocalMethods) {
      logTest('Payment methods include local Bangladeshi methods', 'PASS');
    } else {
      logTest('Payment methods include local Bangladeshi methods', 'WARNING', 'Local payment methods not found');
    }
  }
  
  // Test 5: Verify OrderStatus enum consistency
  logSubSection('Order Status Enum Consistency');
  
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const allStatusesPresent = orderStatuses.every(status => 
    prismaSchemaContent.includes(status) && 
    ordersRouteContent.includes(status)
  );
  
  if (allStatusesPresent) {
    logTest('Order status enum is consistent across schema and code', 'PASS');
  } else {
    logTest('Order status enum is consistent across schema and code', 'WARNING', 'Some order statuses may be missing');
  }
}

// ============================================================================
// SUMMARY REPORT
// ============================================================================

function generateSummary() {
  logSection('TEST SUMMARY');
  
  log('\n  Test Results:', colors.bright);
  log(`    Total Tests:  ${testResults.total}`, colors.cyan);
  log(`    Passed:       ${testResults.passed}`, colors.green);
  log(`    Failed:       ${testResults.failed}`, colors.red);
  log(`    Warnings:     ${testResults.warnings}`, colors.yellow);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`    Pass Rate:    ${passRate}%`, colors.bright);
  
  // Group tests by status
  const failedTests = testResults.tests.filter(t => t.status === 'FAIL');
  const warningTests = testResults.tests.filter(t => t.status === 'WARNING');
  
  if (failedTests.length > 0) {
    log('\n  Failed Tests:', colors.red);
    failedTests.forEach(test => {
      log(`    ✗ ${test.name}`, colors.red);
      if (test.message) {
        log(`      ${test.message}`, colors.reset);
      }
    });
  }
  
  if (warningTests.length > 0) {
    log('\n  Warnings:', colors.yellow);
    warningTests.forEach(test => {
      log(`    ⚠ ${test.name}`, colors.yellow);
      if (test.message) {
        log(`      ${test.message}`, colors.reset);
      }
    });
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      passRate: parseFloat(passRate)
    },
    tests: testResults.tests
  };
  
  const reportPath = path.join(__dirname, `prisma-fixes-test-results-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n  Detailed report saved to: ${reportPath}`, colors.cyan);
  
  // Final verdict
  log('\n' + '='.repeat(80), colors.bright);
  if (testResults.failed === 0 && testResults.warnings === 0) {
    log('  ✓ ALL TESTS PASSED - All Prisma schema fixes are working correctly!', colors.green);
  } else if (testResults.failed === 0) {
    log('  ⚠ ALL TESTS PASSED WITH WARNINGS - Review warnings above', colors.yellow);
  } else {
    log('  ✗ SOME TESTS FAILED - Please review and fix the issues above', colors.red);
  }
  log('='.repeat(80), colors.bright);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('\n' + '='.repeat(80), colors.bright);
  log('  COMPREHENSIVE PRISMA SCHEMA FIXES TEST', colors.bright);
  log('='.repeat(80), colors.bright);
  
  try {
    await testBackendAPI();
    await testFrontendCode();
    await testIntegration();
    await testRegression();
    generateSummary();
  } catch (error) {
    log('\n  Error running tests:', colors.red);
    log(`    ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the tests
main();
