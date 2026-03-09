/**
 * Comprehensive Test Script for Order Modifications CRUD Operations
 * 
 * This script tests all API endpoints for Order Modifications after 404 fix
 * 
 * Usage: node backend/order-modifications-comprehensive.test.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to log test results
function logTestResult(testName, passed, message, details = {}) {
  const result = {
    name: testName,
    status: passed ? 'PASSED' : 'FAILED',
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS.tests.push(result);
  
  if (passed) {
    TEST_RESULTS.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else {
    TEST_RESULTS.failed++;
    console.log(`❌ ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json().catch(() => null);
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: null, error: error.message };
  }
}

/**
 * Test Suite 1: Test Data Verification
 */
async function testDataVerification() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE 1: Test Data Verification');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Count modifications in database
    const totalCount = await prisma.orderModification.count();
    logTestResult(
      'Test Data: Count Modifications',
      totalCount >= 20,
      `Found ${totalCount} modifications in database`,
      { count: totalCount }
    );
    
    // Check modifications have various statuses
    const statusCounts = await prisma.orderModification.groupBy({
      by: ['status'],
      _count: true
    });
    
    const statuses = statusCounts.map(s => s.status).sort();
    const expectedStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    const hasAllStatuses = expectedStatuses.every(s => statuses.includes(s));
    
    logTestResult(
      'Test Data: Status Distribution',
      hasAllStatuses,
      `Found statuses: ${statuses.join(', ')}`,
      { statuses, expected: expectedStatuses }
    );
    
    // Check modifications have various types
    const typeCounts = await prisma.orderModification.groupBy({
      by: ['modificationType'],
      _count: true
    });
    
    const types = typeCounts.map(t => t.modificationType).sort();
    const expectedTypes = ['item_add', 'item_remove', 'quantity_change', 'address_change', 'price_change', 'shipping_method_change', 'payment_method_change', 'custom'];
    const hasAllTypes = expectedTypes.some(t => types.includes(t));
    
    logTestResult(
      'Test Data: Type Distribution',
      hasAllTypes,
      `Found types: ${types.join(', ')}`,
      { types, expected: expectedTypes }
    );
    
    // Get sample modification for testing
    const sampleModification = await prisma.orderModification.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (sampleModification) {
      logTestResult(
        'Test Data: Sample Modification',
        true,
        `Sample modification ID: ${sampleModification.id}`,
        { sample: sampleModification }
      );
    } else {
      logTestResult(
        'Test Data: Sample Modification',
        false,
        'No modifications found in database'
      );
    }
    
    return {
      totalCount,
      statuses,
      types,
      sampleModification
    };
  } catch (error) {
    logTestResult(
      'Test Data: Verification',
      false,
      `Error: ${error.message}`,
      { error: error.stack }
    );
    return null;
  }
}

/**
 * Test Suite 2: API Endpoint Testing
 */
async function testAPIEndpoints(testData) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE 2: API Endpoint Testing');
  console.log('='.repeat(60) + '\n');
  
  // Test 2.1: GET /api/v1/orders/admin/modifications - Default (no filters)
  console.log('\n--- Test 2.1: GET /api/v1/orders/admin/modifications (Default) ---');
  const result1 = await apiRequest('/orders/admin/modifications');
  logTestResult(
    'API: GET /orders/admin/modifications (Default)',
    result1.ok,
    result1.ok ? `Successfully fetched modifications` : `Failed with status ${result1.status}`,
    { status: result1.status, data: result1.data }
  );
  
  // Test 2.2: GET /api/v1/orders/admin/modifications - With status filter
  console.log('\n--- Test 2.2: GET /orders/admin/modifications (Status Filter) ---');
  const statuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
  for (const status of statuses) {
    const result = await apiRequest(`/orders/admin/modifications?status=${status}`);
    logTestResult(
      `API: GET /orders/admin/modifications?status=${status}`,
      result.ok,
      result.ok ? `Fetched ${status} modifications` : `Failed with status ${result.status}`,
      { status: result.status, count: result.data?.data?.length || 0 }
    );
  }
  
  // Test 2.3: GET /api/v1/orders/admin/modifications - With type filter
  console.log('\n--- Test 2.3: GET /orders/admin/modifications (Type Filter) ---');
  const types = ['item_add', 'item_remove', 'quantity_change', 'address_change'];
  for (const type of types) {
    const result = await apiRequest(`/orders/admin/modifications?type=${type}`);
    logTestResult(
      `API: GET /orders/admin/modifications?type=${type}`,
      result.ok,
      result.ok ? `Fetched ${type} modifications` : `Failed with status ${result.status}`,
      { status: result.status, count: result.data?.data?.length || 0 }
    );
  }
  
  // Test 2.4: GET /api/v1/orders/admin/modifications - With pagination
  console.log('\n--- Test 2.4: GET /orders/admin/modifications (Pagination) ---');
  const paginationTests = [
    { page: 1, limit: 10 },
    { page: 2, limit: 10 },
    { page: 1, limit: 5 },
    { page: 1, limit: 50 }
  ];
  
  for (const { page, limit } of paginationTests) {
    const result = await apiRequest(`/orders/admin/modifications?page=${page}&limit=${limit}`);
    logTestResult(
      `API: GET /orders/admin/modifications?page=${page}&limit=${limit}`,
      result.ok,
      result.ok ? `Fetched page ${page} with limit ${limit}` : `Failed with status ${result.status}`,
      { 
        status: result.status, 
        count: result.data?.data?.length || 0,
        pagination: result.data?.pagination 
      }
    );
  }
  
  // Test 2.5: GET /api/v1/orders/admin/modifications - Combined filters
  console.log('\n--- Test 2.5: GET /orders/admin/modifications (Combined Filters) ---');
  const combinedResult = await apiRequest('/orders/admin/modifications?status=pending&type=item_add&page=1&limit=5');
  logTestResult(
    'API: GET /orders/admin/modifications (Combined Filters)',
    combinedResult.ok,
    combinedResult.ok ? 'Fetched with combined filters' : `Failed with status ${combinedResult.status}`,
    { 
      status: combinedResult.status, 
      count: combinedResult.data?.data?.length || 0,
      filters: { status: 'pending', type: 'item_add', page: 1, limit: 5 }
    }
  );
  
  // Test 2.6: GET /api/v1/orders/:id/modifications for specific orders
  console.log('\n--- Test 2.6: GET /orders/:id/modifications ---');
  if (testData?.sampleModification) {
    const result = await apiRequest(`/orders/${testData.sampleModification.orderId}/modifications`);
    logTestResult(
      'API: GET /orders/:id/modifications',
      result.ok,
      result.ok ? `Fetched modifications for order ${testData.sampleModification.orderId}` : `Failed with status ${result.status}`,
      { 
        status: result.status, 
        orderId: testData.sampleModification.orderId,
        count: result.data?.data?.length || 0 
      }
    );
  } else {
    logTestResult(
      'API: GET /orders/:id/modifications',
      false,
      'Skipped: No sample modification available'
    );
  }
  
  // Test 2.7: GET /api/v1/orders/:id/modifications with invalid order ID
  console.log('\n--- Test 2.7: GET /orders/:id/modifications (Invalid ID) ---');
  const invalidOrderResult = await apiRequest('/orders/00000000-0000-0000-0000-000000000000/modifications');
  logTestResult(
    'API: GET /orders/:id/modifications (Invalid ID)',
    !invalidOrderResult.ok && invalidOrderResult.status === 404,
    'Correctly returned 404 for invalid order ID',
    { status: invalidOrderResult.status }
  );
}

/**
 * Test Suite 3: CRUD Operations
 */
async function testCRUDOperations(testData) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE 3: CRUD Operations');
  console.log('='.repeat(60) + '\n');
  
  // Test 3.1: POST /api/v1/orders/:id/modifications - Create new modification
  console.log('\n--- Test 3.1: POST /orders/:id/modifications (Create) ---');
  if (testData?.sampleModification) {
    const createResult = await apiRequest(`/orders/${testData.sampleModification.orderId}/modifications`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'item_add',
        reason: 'Test modification via API',
        changes: {
          items: [{
            productId: 'test-product-001',
            quantity: 1,
            price: 99.99
          }]
        }
      })
    });
    
    logTestResult(
      'CRUD: POST /orders/:id/modifications',
      createResult.ok,
      createResult.ok ? 'Successfully created modification' : `Failed with status ${createResult.status}`,
      { status: createResult.status, data: createResult.data }
    );
  } else {
    logTestResult(
      'CRUD: POST /orders/:id/modifications',
      false,
      'Skipped: No sample modification available'
    );
  }
  
  // Test 3.2: PUT /api/v1/orders/:id/modifications/:modificationId/approve
  console.log('\n--- Test 3.2: PUT /orders/:id/modifications/:id/approve ---');
  if (testData?.sampleModification && testData.sampleModification.status === 'pending') {
    const approveResult = await apiRequest(
      `/orders/${testData.sampleModification.orderId}/modifications/${testData.sampleModification.id}/approve`,
      {
        method: 'PUT',
        body: JSON.stringify({
          adminNotes: 'Approved via test script'
        })
      }
    );
    
    logTestResult(
      'CRUD: PUT /orders/:id/modifications/:id/approve',
      approveResult.ok,
      approveResult.ok ? 'Successfully approved modification' : `Failed with status ${approveResult.status}`,
      { status: approveResult.status, data: approveResult.data }
    );
  } else {
    logTestResult(
      'CRUD: PUT /orders/:id/modifications/:id/approve',
      false,
      'Skipped: No pending modification available'
    );
  }
  
  // Test 3.3: PUT /api/v1/orders/:id/modifications/:modificationId/reject
  console.log('\n--- Test 3.3: PUT /orders/:id/modifications/:id/reject ---');
  // Find another pending modification to reject
  const pendingModification = await prisma.orderModification.findFirst({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (pendingModification) {
    const rejectResult = await apiRequest(
      `/orders/${pendingModification.orderId}/modifications/${pendingModification.id}/reject`,
      {
        method: 'PUT',
        body: JSON.stringify({
          reason: 'Rejected via test script'
        })
      }
    );
    
    logTestResult(
      'CRUD: PUT /orders/:id/modifications/:id/reject',
      rejectResult.ok,
      rejectResult.ok ? 'Successfully rejected modification' : `Failed with status ${rejectResult.status}`,
      { status: rejectResult.status, data: rejectResult.data }
    );
  } else {
    logTestResult(
      'CRUD: PUT /orders/:id/modifications/:id/reject',
      false,
      'Skipped: No pending modification available'
    );
  }
  
  // Test 3.4: POST with invalid data
  console.log('\n--- Test 3.4: POST /orders/:id/modifications (Invalid Data) ---');
  if (testData?.sampleModification) {
    const invalidResult = await apiRequest(`/orders/${testData.sampleModification.orderId}/modifications`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'invalid_type',
        reason: 'Test with invalid type'
      })
    });
    
    logTestResult(
      'CRUD: POST /orders/:id/modifications (Invalid Type)',
      !invalidResult.ok && invalidResult.status === 400,
      'Correctly rejected invalid modification type',
      { status: invalidResult.status, data: invalidResult.data }
    );
  }
}

/**
 * Test Suite 4: Edge Cases and Error Handling
 */
async function testEdgeCases() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE 4: Edge Cases and Error Handling');
  console.log('='.repeat(60) + '\n');
  
  // Test 4.1: Approve already approved modification
  console.log('\n--- Test 4.1: Approve Already Approved Modification ---');
  const approvedModification = await prisma.orderModification.findFirst({
    where: { status: 'approved' }
  });
  
  if (approvedModification) {
    const result = await apiRequest(
      `/orders/${approvedModification.orderId}/modifications/${approvedModification.id}/approve`,
      {
        method: 'PUT',
        body: JSON.stringify({ adminNotes: 'Test' })
      }
    );
    
    logTestResult(
      'Edge Case: Approve Already Approved',
      !result.ok && result.status === 400,
      'Correctly rejected already approved modification',
      { status: result.status, data: result.data }
    );
  } else {
    logTestResult(
      'Edge Case: Approve Already Approved',
      false,
      'Skipped: No approved modification available'
    );
  }
  
  // Test 4.2: Reject already rejected modification
  console.log('\n--- Test 4.2: Reject Already Rejected Modification ---');
  const rejectedModification = await prisma.orderModification.findFirst({
    where: { status: 'rejected' }
  });
  
  if (rejectedModification) {
    const result = await apiRequest(
      `/orders/${rejectedModification.orderId}/modifications/${rejectedModification.id}/reject`,
      {
        method: 'PUT',
        body: JSON.stringify({ reason: 'Test' })
      }
    );
    
    logTestResult(
      'Edge Case: Reject Already Rejected',
      !result.ok && result.status === 400,
      'Correctly rejected already rejected modification',
      { status: result.status, data: result.data }
    );
  } else {
    logTestResult(
      'Edge Case: Reject Already Rejected',
      false,
      'Skipped: No rejected modification available'
    );
  }
  
  // Test 4.3: Get modifications with invalid status
  console.log('\n--- Test 4.3: GET with Invalid Status ---');
  const invalidStatusResult = await apiRequest('/orders/admin/modifications?status=invalid_status');
  logTestResult(
    'Edge Case: GET with Invalid Status',
    !invalidStatusResult.ok && invalidStatusResult.status === 400,
    'Correctly rejected invalid status parameter',
    { status: invalidStatusResult.status, data: invalidStatusResult.data }
  );
  
  // Test 4.4: Get modifications with invalid type
  console.log('\n--- Test 4.4: GET with Invalid Type ---');
  const invalidTypeResult = await apiRequest('/orders/admin/modifications?type=invalid_type');
  logTestResult(
    'Edge Case: GET with Invalid Type',
    !invalidTypeResult.ok && invalidTypeResult.status === 400,
    'Correctly rejected invalid type parameter',
    { status: invalidTypeResult.status, data: invalidTypeResult.data }
  );
  
  // Test 4.5: Get modifications with invalid pagination
  console.log('\n--- Test 4.5: GET with Invalid Pagination ---');
  const invalidPageResult = await apiRequest('/orders/admin/modifications?page=-1&limit=10');
  logTestResult(
    'Edge Case: GET with Invalid Page',
    !invalidPageResult.ok && invalidPageResult.status === 400,
    'Correctly rejected invalid page parameter',
    { status: invalidPageResult.status, data: invalidPageResult.data }
  );
}

/**
 * Test Suite 5: Performance Testing
 */
async function testPerformance() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE 5: Performance Testing');
  console.log('='.repeat(60) + '\n');
  
  const performanceTests = [
    { name: 'Default Query', endpoint: '/orders/admin/modifications' },
    { name: 'Status Filter', endpoint: '/orders/admin/modifications?status=pending' },
    { name: 'Type Filter', endpoint: '/orders/admin/modifications?type=item_add' },
    { name: 'Combined Filters', endpoint: '/orders/admin/modifications?status=pending&type=item_add&page=1&limit=10' },
    { name: 'Pagination', endpoint: '/orders/admin/modifications?page=1&limit=20' }
  ];
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    const result = await apiRequest(test.endpoint);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const isFast = responseTime < 1000; // Less than 1 second
    logTestResult(
      `Performance: ${test.name}`,
      isFast,
      `Response time: ${responseTime}ms`,
      { 
        responseTime, 
        status: result.status,
        threshold: '< 1000ms'
      }
    );
  }
}

/**
 * Generate Test Report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(60) + '\n');
  
  console.log('SUMMARY:');
  console.log(`  Total Tests: ${TEST_RESULTS.passed + TEST_RESULTS.failed + TEST_RESULTS.skipped}`);
  console.log(`  Passed: ${TEST_RESULTS.passed} ✅`);
  console.log(`  Failed: ${TEST_RESULTS.failed} ❌`);
  console.log(`  Skipped: ${TEST_RESULTS.skipped} ⏭️`);
  console.log(`  Success Rate: ${((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100).toFixed(2)}%\n`);
  
  console.log('DETAILED RESULTS:');
  TEST_RESULTS.tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Status: ${test.status}`);
    console.log(`   Message: ${test.message}`);
    if (Object.keys(test.details).length > 0) {
      console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
    }
    console.log(`   Timestamp: ${test.timestamp}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  return TEST_RESULTS;
}

/**
 * Main Test Execution
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     ORDER MODIFICATIONS CRUD COMPREHENSIVE TEST SUITE             ║');
  console.log('║     Testing after 404 route fix                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Run all test suites
    const testData = await testDataVerification();
    await testAPIEndpoints(testData);
    await testCRUDOperations(testData);
    await testEdgeCases();
    await testPerformance();
    
    // Generate report
    const report = generateTestReport();
    
    // Save report to file
    const fs = require('fs');
    const reportContent = JSON.stringify(report, null, 2);
    fs.writeFileSync(
      'order-modifications-test-report-' + Date.now() + '.json',
      reportContent
    );
    console.log('\n📄 Test report saved to: order-modifications-test-report-' + Date.now() + '.json\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests();
