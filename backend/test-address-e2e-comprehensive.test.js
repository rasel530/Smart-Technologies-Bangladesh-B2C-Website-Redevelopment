/**
 * Comprehensive End-to-End Test for Bangladesh Address Management
 * Tests all functionality including database constraint, API endpoints, and edge cases
 * Date: 2026-01-09
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = `test.e2e.${Date.now()}@smarttech.bd`;
const TEST_USER_PASSWORD = 'Test123456';

// Bangladesh Divisions
const DIVISIONS = [
  'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET',
  'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, message, details = null) {
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`\n[${status}] ${testName}`);
  console.log(`    ${message}`);
  if (details) {
    console.log(`    Details:`, details);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, token, data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  return {
    status: response.status,
    data: await response.json()
  };
}

// Helper function to login and get token
async function loginAndGetToken(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
  });
  
  const result = await response.json();
  return result.token || result.data?.token;
}

// Helper function to create test user
async function createTestUser() {
  console.log('\n[SETUP] Creating test user...');
  
  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 12);
  
  const user = await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: '+8801712345678',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      phoneVerified: new Date()
    }
  });
  
  console.log(`[SETUP] Test user created: ${user.email}`);
  return user;
}

// Helper function to cleanup test data
async function cleanupTestData(userId) {
  console.log('\n[CLEANUP] Removing test data...');
  
  await prisma.address.deleteMany({
    where: { userId }
  });
  
  await prisma.user.delete({
    where: { id: userId }
  });
  
  console.log('[CLEANUP] Cleanup completed');
}

// ============================================================================
// DATABASE LAYER TESTS
// ============================================================================

async function testDatabaseConstraint() {
  console.log('\n' + '='.repeat(70));
  console.log('DATABASE LAYER TESTS');
  console.log('='.repeat(70));
  
  const testUser = await prisma.user.create({
    data: {
      email: `db.test.${Date.now()}@example.com`,
      password: 'hashedpassword123',
      firstName: 'DB',
      lastName: 'Test',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    }
  });
  
  try {
    // Test 1: Create first default address (should succeed)
    console.log('\n[DB Test 1] Creating first default address...');
    const address1 = await prisma.address.create({
      data: {
        userId: testUser.id,
        type: 'SHIPPING',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main Street',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        postalCode: '1000',
        isDefault: true
      }
    });
    logTest('DB: Create First Default Address', true, 'First default address created', { id: address1.id });
    
    // Test 2: Try to create second default address (should fail)
    console.log('\n[DB Test 2] Attempting to create second default address...');
    try {
      await prisma.address.create({
        data: {
          userId: testUser.id,
          type: 'SHIPPING',
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak Avenue',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          postalCode: '1001',
          isDefault: true
        }
      });
      logTest('DB: Prevent Multiple Default Addresses', false, 'Constraint did not prevent second default address');
    } catch (error) {
      if (error.code === 'P2002') {
        logTest('DB: Prevent Multiple Default Addresses', true, 'Constraint correctly prevented second default address', { error: error.code });
      } else {
        logTest('DB: Prevent Multiple Default Addresses', false, 'Unexpected error', { error: error.code, message: error.message });
      }
    }
    
    // Test 3: Create non-default address (should succeed)
    console.log('\n[DB Test 3] Creating non-default address...');
    const address2 = await prisma.address.create({
      data: {
        userId: testUser.id,
        type: 'BILLING',
        firstName: 'Bob',
        lastName: 'Johnson',
        address: '789 Pine Road',
        city: 'Chittagong',
        district: 'Chittagong',
        division: 'CHITTAGONG',
        postalCode: '4000',
        isDefault: false
      }
    });
    logTest('DB: Create Non-Default Address', true, 'Non-default address created', { id: address2.id });
    
    // Test 4: Verify only one default address exists
    console.log('\n[DB Test 4] Verifying default address count...');
    const addresses = await prisma.address.findMany({
      where: { userId: testUser.id }
    });
    const defaultCount = addresses.filter(a => a.isDefault).length;
    if (defaultCount === 1) {
      logTest('DB: Verify Single Default Address', true, 'Only one default address exists', { count: defaultCount });
    } else {
      logTest('DB: Verify Single Default Address', false, `Expected 1 default address, found ${defaultCount}`);
    }
    
    // Test 5: Update non-default to default (should succeed and remove other default)
    console.log('\n[DB Test 5] Updating non-default to default...');
    try {
      await prisma.address.update({
        where: { id: address2.id },
        data: { isDefault: true }
      });
      
      const updatedAddresses = await prisma.address.findMany({
        where: { userId: testUser.id }
      });
      const newDefaultCount = updatedAddresses.filter(a => a.isDefault).length;
      
      if (newDefaultCount === 1 && updatedAddresses.find(a => a.id === address2.id).isDefault) {
        logTest('DB: Update to Default', true, 'Successfully updated to default, old default removed', { count: newDefaultCount });
      } else {
        logTest('DB: Update to Default', false, 'Update did not work correctly', { count: newDefaultCount });
      }
    } catch (error) {
      logTest('DB: Update to Default', false, 'Error during update', { error: error.message });
    }
    
  } finally {
    // Cleanup
    await prisma.address.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  }
}

// ============================================================================
// API ENDPOINT TESTS
// ============================================================================

async function testAPIEndpoints(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('API ENDPOINT TESTS');
  console.log('='.repeat(70));
  
  // Test 1: Create Address
  console.log('\n[API Test 1] Creating address...');
  const newAddress = {
    type: 'SHIPPING',
    firstName: 'Rahim',
    lastName: 'Ahmed',
    phone: '+8801712345678',
    address: 'House 12, Road 5',
    addressLine2: 'Dhanmondi',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Dhanmondi',
    postalCode: '1205',
    isDefault: false
  };
  
  const createResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, newAddress);
  if (createResponse.status === 201 && createResponse.data.address) {
    logTest('API: Create Address', true, 'Address created successfully', createResponse.data.address);
    var addressId = createResponse.data.address.id;
  } else {
    logTest('API: Create Address', false, `Failed to create address. Status: ${createResponse.status}`, createResponse.data);
    return null;
  }
  
  // Test 2: Get Addresses
  console.log('\n[API Test 2] Getting addresses...');
  const getResponse = await apiRequest('GET', `/api/v1/users/${userId}/addresses`, token);
  if (getResponse.status === 200 && Array.isArray(getResponse.data.addresses)) {
    logTest('API: Get Addresses', true, `Retrieved ${getResponse.data.addresses.length} addresses`, getResponse.data.addresses);
  } else {
    logTest('API: Get Addresses', false, `Failed to get addresses. Status: ${getResponse.status}`, getResponse.data);
  }
  
  // Test 3: Update Address
  console.log('\n[API Test 3] Updating address...');
  const updateData = {
    firstName: 'Karim',
    lastName: 'Hossain',
    phone: '+8801912345678',
    address: 'House 15, Road 8',
    addressLine2: 'Mirpur',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Mirpur',
    postalCode: '1216'
  };
  
  const updateResponse = await apiRequest('PUT', `/api/v1/users/${userId}/addresses/${addressId}`, token, updateData);
  if (updateResponse.status === 200 && updateResponse.data.address) {
    logTest('API: Update Address', true, 'Address updated successfully', updateResponse.data.address);
  } else {
    logTest('API: Update Address', false, `Failed to update address. Status: ${updateResponse.status}`, updateResponse.data);
  }
  
  // Test 4: Set Default Address
  console.log('\n[API Test 4] Setting default address...');
  const setDefaultResponse = await apiRequest('PUT', `/api/v1/users/${userId}/addresses/${addressId}/default`, token);
  if (setDefaultResponse.status === 200 && setDefaultResponse.data.address) {
    // Verify only one default address exists
    const allAddresses = await prisma.address.findMany({ where: { userId } });
    const defaultCount = allAddresses.filter(a => a.isDefault).length;
    
    if (defaultCount === 1) {
      logTest('API: Set Default Address', true, 'Default address set successfully, only one default exists', { count: defaultCount });
    } else {
      logTest('API: Set Default Address', false, `Multiple default addresses found: ${defaultCount}`);
    }
  } else {
    logTest('API: Set Default Address', false, `Failed to set default. Status: ${setDefaultResponse.status}`, setDefaultResponse.data);
  }
  
  // Test 5: Delete Address
  console.log('\n[API Test 5] Deleting address...');
  const deleteResponse = await apiRequest('DELETE', `/api/v1/users/${userId}/addresses/${addressId}`, token);
  if (deleteResponse.status === 200) {
    const deletedAddress = await prisma.address.findUnique({ where: { id: addressId } });
    if (!deletedAddress) {
      logTest('API: Delete Address', true, 'Address deleted successfully from database');
    } else {
      logTest('API: Delete Address', false, 'Address still exists in database');
    }
  } else {
    logTest('API: Delete Address', false, `Failed to delete address. Status: ${deleteResponse.status}`, deleteResponse.data);
  }
  
  return addressId;
}

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

async function testEdgeCases(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('EDGE CASES TESTS');
  console.log('='.repeat(70));
  
  // Edge Case 1: Create first address as default (should auto-become default)
  console.log('\n[Edge Case 1] Creating first address without isDefault flag...');
  const firstAddress = {
    type: 'SHIPPING',
    firstName: 'First',
    lastName: 'Address',
    address: 'First Address',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    postalCode: '1000'
  };
  
  const firstResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, firstAddress);
  if (firstResponse.status === 201) {
    const isDefault = firstResponse.data.address.isDefault;
    logTest('Edge Case: First Address Default', isDefault === true, 'First address should become default automatically', { isDefault });
    var firstAddressId = firstResponse.data.address.id;
  } else {
    logTest('Edge Case: First Address Default', false, 'Failed to create first address');
  }
  
  // Edge Case 2: Create second default address (should replace first)
  console.log('\n[Edge Case 2] Creating second default address...');
  const secondAddress = {
    type: 'BILLING',
    firstName: 'Second',
    lastName: 'Address',
    address: 'Second Address',
    city: 'Chittagong',
    district: 'Chittagong',
    division: 'CHITTAGONG',
    postalCode: '4000',
    isDefault: true
  };
  
  const secondResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, secondAddress);
  if (secondResponse.status === 201) {
    // Verify first address is no longer default
    const firstAddr = await prisma.address.findUnique({ where: { id: firstAddressId } });
    const allAddrs = await prisma.address.findMany({ where: { userId } });
    const defaultCount = allAddrs.filter(a => a.isDefault).length;
    
    if (!firstAddr.isDefault && defaultCount === 1) {
      logTest('Edge Case: Replace Default', true, 'Second default replaced first default', { firstIsDefault: firstAddr.isDefault, defaultCount });
    } else {
      logTest('Edge Case: Replace Default', false, 'Default replacement did not work correctly', { firstIsDefault: firstAddr.isDefault, defaultCount });
    }
    var secondAddressId = secondResponse.data.address.id;
  } else {
    logTest('Edge Case: Replace Default', false, 'Failed to create second default address');
  }
  
  // Edge Case 3: Delete default address (next address should become default)
  console.log('\n[Edge Case 3] Deleting default address...');
  const deleteDefaultResponse = await apiRequest('DELETE', `/api/v1/users/${userId}/addresses/${secondAddressId}`, token);
  if (deleteDefaultResponse.status === 200) {
    const remainingAddrs = await prisma.address.findMany({ where: { userId } });
    const newDefault = remainingAddrs.find(a => a.isDefault);
    
    if (newDefault) {
      logTest('Edge Case: Delete Default', true, 'Next address became default after deletion', { newDefaultId: newDefault.id });
    } else {
      logTest('Edge Case: Delete Default', false, 'No address became default after deletion');
    }
  } else {
    logTest('Edge Case: Delete Default', false, 'Failed to delete default address');
  }
  
  // Edge Case 4: Invalid division
  console.log('\n[Edge Case 4] Testing invalid division...');
  const invalidDivision = {
    type: 'SHIPPING',
    firstName: 'Invalid',
    lastName: 'Division',
    address: 'Invalid Address',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'INVALID_DIVISION',
    postalCode: '1000'
  };
  
  const invalidResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, invalidDivision);
  if (invalidResponse.status === 400) {
    logTest('Edge Case: Invalid Division', true, 'Correctly rejected invalid division', invalidResponse.data);
  } else {
    logTest('Edge Case: Invalid Division', false, 'Should reject invalid division', { status: invalidResponse.status });
  }
  
  // Edge Case 5: Invalid postal code format
  console.log('\n[Edge Case 5] Testing invalid postal code...');
  const invalidPostalCode = {
    type: 'SHIPPING',
    firstName: 'Invalid',
    lastName: 'Postal',
    address: 'Invalid Address',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    postalCode: 'ABC'
  };
  
  const invalidPostalResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, invalidPostalCode);
  if (invalidPostalResponse.status === 400) {
    logTest('Edge Case: Invalid Postal Code', true, 'Correctly rejected invalid postal code', invalidPostalResponse.data);
  } else {
    logTest('Edge Case: Invalid Postal Code', false, 'Should reject invalid postal code', { status: invalidPostalResponse.status });
  }
  
  // Edge Case 6: Missing required fields
  console.log('\n[Edge Case 6] Testing missing required fields...');
  const missingFields = {
    type: 'SHIPPING',
    firstName: 'Missing',
    // lastName missing
    address: 'Missing Fields',
    // city missing
    district: 'Dhaka',
    division: 'DHAKA',
    postalCode: '1000'
  };
  
  const missingResponse = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, missingFields);
  if (missingResponse.status === 400) {
    logTest('Edge Case: Missing Required Fields', true, 'Correctly rejected missing fields', missingResponse.data);
  } else {
    logTest('Edge Case: Missing Required Fields', false, 'Should reject missing fields', { status: missingResponse.status });
  }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testIntegration(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('INTEGRATION TESTS');
  console.log('='.repeat(70));
  
  // Integration Test 1: Complete user flow - Create, Read, Update, Delete
  console.log('\n[Integration Test 1] Complete CRUD flow...');
  
  // Create
  const address1 = {
    type: 'SHIPPING',
    firstName: 'Integration',
    lastName: 'Test',
    address: 'Integration Address',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    postalCode: '1000'
  };
  
  const createResp = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, address1);
  if (createResp.status !== 201) {
    logTest('Integration: CRUD Flow', false, 'Failed to create address');
    return;
  }
  
  const addressId = createResp.data.address.id;
  
  // Read
  const getResp = await apiRequest('GET', `/api/v1/users/${userId}/addresses`, token);
  if (getResp.status !== 200) {
    logTest('Integration: CRUD Flow', false, 'Failed to get addresses');
    return;
  }
  
  // Update
  const updateData = { firstName: 'Updated' };
  const updateResp = await apiRequest('PUT', `/api/v1/users/${userId}/addresses/${addressId}`, token, updateData);
  if (updateResp.status !== 200) {
    logTest('Integration: CRUD Flow', false, 'Failed to update address');
    return;
  }
  
  // Delete
  const deleteResp = await apiRequest('DELETE', `/api/v1/users/${userId}/addresses/${addressId}`, token);
  if (deleteResp.status !== 200) {
    logTest('Integration: CRUD Flow', false, 'Failed to delete address');
    return;
  }
  
  logTest('Integration: CRUD Flow', true, 'Complete CRUD flow successful');
  
  // Integration Test 2: Multiple addresses with default management
  console.log('\n[Integration Test 2] Multiple addresses with default management...');
  
  const addresses = [];
  for (let i = 1; i <= 5; i++) {
    const addr = {
      type: i === 1 ? 'SHIPPING' : 'BILLING',
      firstName: `Address${i}`,
      lastName: `Test${i}`,
      address: `Address ${i}`,
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'DHAKA',
      postalCode: `100${i}`,
      isDefault: i === 1
    };
    
    const resp = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, addr);
    if (resp.status === 201) {
      addresses.push(resp.data.address.id);
    }
  }
  
  // Verify only one default
  const allAddrs = await prisma.address.findMany({ where: { userId } });
  const defaultCount = allAddrs.filter(a => a.isDefault).length;
  
  if (defaultCount === 1) {
    logTest('Integration: Multiple Addresses', true, 'Created 5 addresses with only 1 default', { total: allAddrs.length, defaultCount });
  } else {
    logTest('Integration: Multiple Addresses', false, `Expected 1 default, found ${defaultCount}`);
  }
  
  // Integration Test 3: Test all valid divisions
  console.log('\n[Integration Test 3] Testing all valid divisions...');
  
  let divisionsTested = 0;
  for (const division of DIVISIONS) {
    const addr = {
      type: 'SHIPPING',
      firstName: division,
      lastName: 'Test',
      address: `${division} Address`,
      city: 'Dhaka',
      district: 'Dhaka',
      division: division,
      postalCode: '1000'
    };
    
    const resp = await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, addr);
    if (resp.status === 201) {
      await prisma.address.delete({ where: { id: resp.data.address.id } });
      divisionsTested++;
    }
  }
  
  if (divisionsTested === DIVISIONS.length) {
    logTest('Integration: All Divisions', true, `Successfully tested all ${DIVISIONS.length} divisions`);
  } else {
    logTest('Integration: All Divisions', false, `Only tested ${divisionsTested}/${DIVISIONS.length} divisions`);
  }
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

async function testPerformance(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('PERFORMANCE TESTS');
  console.log('='.repeat(70));
  
  // Performance Test 1: Create multiple addresses
  console.log('\n[Performance Test 1] Creating 10 addresses...');
  const startTime = Date.now();
  
  for (let i = 1; i <= 10; i++) {
    const addr = {
      type: 'SHIPPING',
      firstName: `Perf${i}`,
      lastName: 'Test',
      address: `Performance Address ${i}`,
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'DHAKA',
      postalCode: `100${i}`
    };
    
    await apiRequest('POST', `/api/v1/users/${userId}/addresses`, token, addr);
  }
  
  const createTime = Date.now() - startTime;
  logTest('Performance: Create 10 Addresses', createTime < 5000, `Created 10 addresses in ${createTime}ms`, { time: createTime });
  
  // Performance Test 2: Get all addresses
  console.log('\n[Performance Test 2] Getting all addresses...');
  const getStartTime = Date.now();
  const getResp = await apiRequest('GET', `/api/v1/users/${userId}/addresses`, token);
  const getTime = Date.now() - getStartTime;
  
  logTest('Performance: Get All Addresses', getTime < 500, `Retrieved ${getResp.data.addresses.length} addresses in ${getTime}ms`, { time: getTime, count: getResp.data.addresses.length });
  
  // Performance Test 3: Set default address
  console.log('\n[Performance Test 3] Setting default address...');
  const setDefaultStartTime = Date.now();
  
  const addresses = await prisma.address.findMany({ where: { userId } });
  if (addresses.length > 0) {
    await apiRequest('PUT', `/api/v1/users/${userId}/addresses/${addresses[0].id}/default`, token);
  }
  
  const setDefaultTime = Date.now() - setDefaultStartTime;
  logTest('Performance: Set Default Address', setDefaultTime < 500, `Set default address in ${setDefaultTime}ms`, { time: setDefaultTime });
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runTests() {
  console.log('\n');
  console.log('============================================================');
  console.log('BANGLADESH ADDRESS MANAGEMENT - END-TO-END VERIFICATION');
  console.log('Date: 2026-01-09');
  console.log('============================================================');
  
  let testUser = null;
  let token = null;
  
  try {
    // Run Database Layer Tests
    await testDatabaseConstraint();
    
    // Create test user for API tests
    testUser = await createTestUser();
    token = await loginAndGetToken(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    
    if (!token) {
      console.error('\nERROR: Failed to get authentication token');
      console.log('Skipping API tests...');
      return;
    }
    
    // Run API Endpoint Tests
    await testAPIEndpoints(testUser.id, token);
    
    // Run Edge Cases Tests
    await testEdgeCases(testUser.id, token);
    
    // Run Integration Tests
    await testIntegration(testUser.id, token);
    
    // Run Performance Tests
    await testPerformance(testUser.id, token);
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
  } finally {
    // Cleanup
    if (testUser) {
      await cleanupTestData(testUser.id);
    }
    
    await prisma.$disconnect();
  }
  
  // Print Summary
  console.log('\n');
  console.log('============================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================');
  console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.message}`);
    });
  }
  
  console.log('\n');
  console.log('============================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('============================================================');
}

// Run the tests
runTests()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
