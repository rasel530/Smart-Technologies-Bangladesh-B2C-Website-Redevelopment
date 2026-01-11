/**
 * Comprehensive Bangladesh Address Management Test Script
 * Tests all address management endpoints with detailed validation
 * Phase 3, Milestone 3, Task 2 - Re-test
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = `test.address.${Date.now()}@smarttech.bd`;
const TEST_USER_PASSWORD = 'Test123456';

// Bangladesh Divisions
const DIVISIONS = [
  'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET',
  'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'
];

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, status, message, details = null) {
  const statusIcons = {
    'PASS': '✅',
    'FAIL': '❌',
    'SKIP': '⏭️'
  };
  
  console.log(`\n${statusIcons[status]} ${status} - ${testName}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
  
  testResults.tests.push({
    name: testName,
    status,
    message,
    details
  });
  
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

// Helper function to make API requests
async function apiRequest(method, endpoint, token, data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message }
    };
  }
}

// Helper function to login and get token
async function loginAndGetToken(email, password) {
  const response = await apiRequest(
    'POST',
    '/api/v1/auth/login',
    null,
    { identifier: email, password }
  );
  
  if (response.status === 200 && (response.data.token || response.data.data?.token)) {
    return response.data.token || response.data.data.token;
  }
  return null;
}

// Helper function to create test user
async function createTestUser() {
  console.log('\n👤 Creating test user...');
  
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
  
  console.log(`✅ Test user created: ${user.email} (ID: ${user.id})`);
  return user;
}

// Helper function to cleanup test data
async function cleanupTestData(userId) {
  console.log('\n🧹 Cleaning up test data...');
  
  await prisma.address.deleteMany({
    where: { userId }
  });
  
  await prisma.user.delete({
    where: { id: userId }
  });
  
  console.log('✅ Cleanup completed');
}

// ============================================================================
// TEST SUITE 1: POST /api/v1/users/:id/addresses - Create Address
// ============================================================================
async function testCreateAddress(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 1: Create Address');
  console.log('='.repeat(70));
  
  // Test 1.1: Create address with valid data
  console.log('\n--- Test 1.1: Create address with valid data ---');
  const validAddress = {
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
  
  const response = await apiRequest(
    'POST',
    `/api/v1/users/${userId}/addresses`,
    token,
    validAddress
  );
  
  if (response.status === 201 && response.data.address) {
    const address = response.data.address;
    const allFieldsPresent = 
      address.id &&
      address.type === validAddress.type &&
      address.firstName === validAddress.firstName &&
      address.lastName === validAddress.lastName &&
      address.phone === validAddress.phone &&
      address.address === validAddress.address &&
      address.addressLine2 === validAddress.addressLine2 &&
      address.city === validAddress.city &&
      address.district === validAddress.district &&
      address.division === validAddress.division &&
      address.upazila === validAddress.upazila &&
      address.postalCode === validAddress.postalCode &&
      address.isDefault === validAddress.isDefault &&
      address.userId === userId;
    
    if (allFieldsPresent) {
      logTest('Create Address - Valid Data', 'PASS', 'Address created successfully with all fields', address);
      return address;
    } else {
      logTest('Create Address - Valid Data', 'FAIL', 'Address created but some fields are missing or incorrect', 
        { expected: validAddress, received: address });
      return null;
    }
  } else {
    logTest('Create Address - Valid Data', 'FAIL', 
      `Failed to create address. Status: ${response.status}`, response.data);
    return null;
  }
}

// Test 1.2: Create default address (first address becomes default)
async function testCreateDefaultAddress(userId, token) {
  console.log('\n--- Test 1.2: Create default address ---');
  
  const defaultAddress = {
    type: 'BILLING',
    firstName: 'Fatima',
    lastName: 'Begum',
    phone: '+8801812345678',
    address: 'Flat 3B, Building 4',
    addressLine2: 'Gulshan 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Gulshan',
    postalCode: '1212',
    isDefault: true
  };
  
  const response = await apiRequest(
    'POST',
    `/api/v1/users/${userId}/addresses`,
    token,
    defaultAddress
  );
  
  if (response.status === 201 && response.data.address) {
    const address = response.data.address;
    
    if (address.isDefault === true) {
      // Verify only one default address exists
      const allAddresses = await prisma.address.findMany({
        where: { userId }
      });
      const defaultCount = allAddresses.filter(a => a.isDefault).length;
      
      if (defaultCount === 1) {
        logTest('Create Address - Default', 'PASS', 
          'Default address created successfully, only one default exists', 
          { address, defaultCount });
        return address;
      } else {
        logTest('Create Address - Default', 'FAIL', 
          `Multiple default addresses found: ${defaultCount}`, 
          { addresses: allAddresses });
        return null;
      }
    } else {
      logTest('Create Address - Default', 'FAIL', 
        'isDefault flag not set correctly', 
        { expected: true, received: address.isDefault });
      return null;
    }
  } else {
    logTest('Create Address - Default', 'FAIL', 
      `Failed to create default address. Status: ${response.status}`, response.data);
    return null;
  }
}

// Test 1.3: Create address with missing required fields
async function testCreateMissingFields(userId, token) {
  console.log('\n--- Test 1.3: Create address with missing required fields ---');
  
  const missingFieldsAddress = {
    type: 'SHIPPING',
    firstName: 'Test',
    // lastName missing
    address: 'House 1',
    // city missing
    district: 'Dhaka',
    division: 'DHAKA',
    // upazila missing
    postalCode: '1205'
  };
  
  const response = await apiRequest(
    'POST',
    `/api/v1/users/${userId}/addresses`,
    token,
    missingFieldsAddress
  );
  
  if (response.status === 400) {
    logTest('Create Address - Missing Fields', 'PASS', 
      'Correctly rejects missing required fields', response.data);
  } else {
    logTest('Create Address - Missing Fields', 'FAIL', 
      'Should reject missing fields but did not', 
      { status: response.status, data: response.data });
  }
}

// Test 1.4: Create address with invalid division
async function testCreateInvalidDivision(userId, token) {
  console.log('\n--- Test 1.4: Create address with invalid division ---');
  
  const invalidDivisionAddress = {
    type: 'SHIPPING',
    firstName: 'Test',
    lastName: 'User',
    address: 'House 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'INVALID_DIVISION',
    upazila: 'Dhanmondi',
    postalCode: '1205'
  };
  
  const response = await apiRequest(
    'POST',
    `/api/v1/users/${userId}/addresses`,
    token,
    invalidDivisionAddress
  );
  
  if (response.status === 400) {
    logTest('Create Address - Invalid Division', 'PASS', 
      'Correctly rejects invalid division', response.data);
  } else {
    logTest('Create Address - Invalid Division', 'FAIL', 
      'Should reject invalid division but did not', 
      { status: response.status, data: response.data });
  }
}

// Test 1.5: Create address with invalid postal code
async function testCreateInvalidPostalCode(userId, token) {
  console.log('\n--- Test 1.5: Create address with invalid postal code ---');
  
  const invalidPostalCodeAddress = {
    type: 'SHIPPING',
    firstName: 'Test',
    lastName: 'User',
    address: 'House 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Dhanmondi',
    postalCode: 'ABC'
  };
  
  const response = await apiRequest(
    'POST',
    `/api/v1/users/${userId}/addresses`,
    token,
    invalidPostalCodeAddress
  );
  
  if (response.status === 400) {
    logTest('Create Address - Invalid Postal Code', 'PASS', 
      'Correctly rejects invalid postal code format', response.data);
  } else {
    logTest('Create Address - Invalid Postal Code', 'FAIL', 
      'Should reject invalid postal code but did not', 
      { status: response.status, data: response.data });
  }
}

// Test 1.6: Test all valid divisions
async function testAllValidDivisions(userId, token) {
  console.log('\n--- Test 1.6: Test all valid divisions ---');
  
  let passedDivisions = 0;
  
  for (const division of DIVISIONS) {
    const divisionAddress = {
      type: 'SHIPPING',
      firstName: 'Test',
      lastName: division,
      address: 'House 1',
      city: 'Dhaka',
      district: 'Dhaka',
      division: division,
      upazila: 'Dhanmondi',
      postalCode: '1205'
    };
    
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      divisionAddress
    );
    
    if (response.status === 201) {
      passedDivisions++;
      // Cleanup
      await prisma.address.delete({
        where: { id: response.data.address.id }
      });
    }
  }
  
  if (passedDivisions === DIVISIONS.length) {
    logTest('Create Address - All Divisions', 'PASS', 
      `Successfully tested all ${DIVISIONS.length} divisions`, 
      { divisions: DIVISIONS, passed: passedDivisions });
  } else {
    logTest('Create Address - All Divisions', 'FAIL', 
      `Failed for some divisions. Passed: ${passedDivisions}/${DIVISIONS.length}`, 
      { divisions: DIVISIONS, passed: passedDivisions });
  }
}

// ============================================================================
// TEST SUITE 2: GET /api/v1/users/:id/addresses - Fetch Addresses
// ============================================================================
async function testGetAddresses(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 2: Get Addresses');
  console.log('='.repeat(70));
  
  // Test 2.1: Get all addresses for user
  console.log('\n--- Test 2.1: Get all addresses ---');
  
  const response = await apiRequest(
    'GET',
    `/api/v1/users/${userId}/addresses`,
    token
  );
  
  if (response.status === 200 && Array.isArray(response.data.addresses)) {
    const addresses = response.data.addresses;
    
    if (addresses.length > 0) {
      logTest('Get Addresses - Basic', 'PASS', 
        `Successfully retrieved ${addresses.length} addresses`, addresses);
      
      // Test 2.2: Verify default address is first
      console.log('\n--- Test 2.2: Verify default address ordering ---');
      
      const defaultAddress = addresses.find(a => a.isDefault);
      if (defaultAddress && addresses[0].isDefault) {
        logTest('Get Addresses - Default First', 'PASS', 
          'Default address is returned first', { firstAddress: addresses[0] });
      } else if (defaultAddress) {
        logTest('Get Addresses - Default First', 'FAIL', 
          'Default address exists but is not first', { addresses });
      } else {
        logTest('Get Addresses - Default First', 'SKIP', 
          'No default address found', { addresses });
      }
      
      return addresses;
    } else {
      logTest('Get Addresses - Basic', 'FAIL', 
        'No addresses returned', response.data);
      return [];
    }
  } else {
    logTest('Get Addresses - Basic', 'FAIL', 
      `Failed to get addresses. Status: ${response.status}`, response.data);
    return [];
  }
}

// ============================================================================
// TEST SUITE 3: PUT /api/v1/users/:id/addresses/:addressId - Update Address
// ============================================================================
async function testUpdateAddress(userId, token, addressId) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 3: Update Address');
  console.log('='.repeat(70));
  
  if (!addressId) {
    logTest('Update Address - Basic', 'SKIP', 'No address ID provided');
    return null;
  }
  
  // Test 3.1: Update individual fields
  console.log('\n--- Test 3.1: Update individual fields ---');
  
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
  
  const response = await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${addressId}`,
    token,
    updateData
  );
  
  if (response.status === 200 && response.data.address) {
    const address = response.data.address;
    
    const changesSaved = 
      address.firstName === updateData.firstName &&
      address.lastName === updateData.lastName &&
      address.phone === updateData.phone &&
      address.address === updateData.address &&
      address.addressLine2 === updateData.addressLine2 &&
      address.city === updateData.city &&
      address.district === updateData.district &&
      address.division === updateData.division &&
      address.upazila === updateData.upazila &&
      address.postalCode === updateData.postalCode;
    
    if (changesSaved) {
      logTest('Update Address - Basic', 'PASS', 'Address updated successfully', address);
      return address;
    } else {
      logTest('Update Address - Basic', 'FAIL', 
        'Address updated but some fields not saved correctly', 
        { expected: updateData, received: address });
      return null;
    }
  } else {
    logTest('Update Address - Basic', 'FAIL', 
      `Failed to update address. Status: ${response.status}`, response.data);
    return null;
  }
}

// Test 3.2: Update to default address
async function testUpdateToDefault(userId, token, addressId) {
  console.log('\n--- Test 3.2: Update to default address ---');
  
  if (!addressId) {
    logTest('Update Address - To Default', 'SKIP', 'No address ID provided');
    return;
  }
  
  const response = await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${addressId}`,
    token,
    { isDefault: true }
  );
  
  if (response.status === 200) {
    // Verify only one default address exists
    const allAddresses = await prisma.address.findMany({
      where: { userId }
    });
    const defaultCount = allAddresses.filter(a => a.isDefault).length;
    
    if (defaultCount === 1) {
      logTest('Update Address - To Default', 'PASS', 
        'Updated to default, only one default exists', 
        { defaultCount, totalAddresses: allAddresses.length });
    } else {
      logTest('Update Address - To Default', 'FAIL', 
        `Multiple default addresses found: ${defaultCount}`, 
        { addresses: allAddresses });
    }
  } else {
    logTest('Update Address - To Default', 'FAIL', 
      `Failed to update to default. Status: ${response.status}`, response.data);
  }
}

// Test 3.3: Update non-existent address
async function testUpdateNonExistent(userId, token) {
  console.log('\n--- Test 3.3: Update non-existent address ---');
  
  const fakeAddressId = '00000000-0000-0000-0000-000000000000';
  
  const response = await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${fakeAddressId}`,
    token,
    { firstName: 'Test' }
  );
  
  if (response.status === 404) {
    logTest('Update Address - Non-existent', 'PASS', 
      'Correctly returns 404 for non-existent address', response.data);
  } else {
    logTest('Update Address - Non-existent', 'FAIL', 
      'Should return 404 for non-existent address', 
      { status: response.status, data: response.data });
  }
}

// ============================================================================
// TEST SUITE 4: DELETE /api/v1/users/:id/addresses/:addressId - Delete Address
// ============================================================================
async function testDeleteAddress(userId, token, addressId) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 4: Delete Address');
  console.log('='.repeat(70));
  
  if (!addressId) {
    logTest('Delete Address - Basic', 'SKIP', 'No address ID provided');
    return;
  }
  
  // Test 4.1: Delete address not used in orders
  console.log('\n--- Test 4.1: Delete address not used in orders ---');
  
  const response = await apiRequest(
    'DELETE',
    `/api/v1/users/${userId}/addresses/${addressId}`,
    token
  );
  
  if (response.status === 200) {
    // Verify address is deleted
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });
    
    if (!address) {
      logTest('Delete Address - Basic', 'PASS', 
        'Address deleted successfully from database');
    } else {
      logTest('Delete Address - Basic', 'FAIL', 
        'Address still exists in database after deletion', { addressId });
    }
  } else {
    logTest('Delete Address - Basic', 'FAIL', 
      `Failed to delete address. Status: ${response.status}`, response.data);
  }
}

// Test 4.2: Delete address used in orders
async function testDeleteAddressWithOrders(userId, token) {
  console.log('\n--- Test 4.2: Delete address used in orders ---');
  
  try {
    // Create an address
    const address = await prisma.address.create({
      data: {
        userId,
        type: 'SHIPPING',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678',
        address: 'House 1',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Dhanmondi',
        postalCode: '1205',
        isDefault: false
      }
    });
    
    // Create an order using this address
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        total: 1000,
        subtotal: 1000,
        status: 'PENDING',
        orderNumber: `ORD-${Date.now()}`,
        paymentMethod: 'CASH_ON_DELIVERY'
      }
    });
    
    // Try to delete address
    const response = await apiRequest(
      'DELETE',
      `/api/v1/users/${userId}/addresses/${address.id}`,
      token
    );
    
    if (response.status === 400) {
      logTest('Delete Address - With Orders', 'PASS', 
        'Correctly prevents deletion of address used in orders', response.data);
    } else {
      logTest('Delete Address - With Orders', 'FAIL', 
        'Should prevent deletion but did not', 
        { status: response.status, data: response.data });
    }
    
    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: address.id } });
  } catch (error) {
    logTest('Delete Address - With Orders', 'FAIL', 
      `Error: ${error.message}`, error);
  }
}

// Test 4.3: Delete non-existent address
async function testDeleteNonExistent(userId, token) {
  console.log('\n--- Test 4.3: Delete non-existent address ---');
  
  const fakeAddressId = '00000000-0000-0000-0000-000000000000';
  
  const response = await apiRequest(
    'DELETE',
    `/api/v1/users/${userId}/addresses/${fakeAddressId}`,
    token
  );
  
  if (response.status === 404) {
    logTest('Delete Address - Non-existent', 'PASS', 
      'Correctly returns 404 for non-existent address', response.data);
  } else {
    logTest('Delete Address - Non-existent', 'FAIL', 
      'Should return 404 for non-existent address', 
      { status: response.status, data: response.data });
  }
}

// ============================================================================
// TEST SUITE 5: PUT /api/v1/users/:id/addresses/:addressId/default - Set Default
// ============================================================================
async function testSetDefaultAddress(userId, token) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 5: Set Default Address');
  console.log('='.repeat(70));
  
  // Create two addresses first
  const address1 = await prisma.address.create({
    data: {
      userId,
      type: 'SHIPPING',
      firstName: 'Test',
      lastName: 'One',
      phone: '+8801712345678',
      address: 'House 1',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'DHAKA',
      upazila: 'Dhanmondi',
      postalCode: '1205',
      isDefault: false
    }
  });
  
  const address2 = await prisma.address.create({
    data: {
      userId,
      type: 'BILLING',
      firstName: 'Test',
      lastName: 'Two',
      phone: '+8801812345678',
      address: 'House 2',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'DHAKA',
      upazila: 'Gulshan',
      postalCode: '1212',
      isDefault: false
    }
  });
  
  // Test 5.1: Set address as default
  console.log('\n--- Test 5.1: Set address as default ---');
  
  const response = await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${address1.id}/default`,
    token
  );
  
  if (response.status === 200 && response.data.address) {
    // Verify only one address is default
    const allAddresses = await prisma.address.findMany({
      where: { userId }
    });
    const defaultCount = allAddresses.filter(a => a.isDefault).length;
    
    if (defaultCount === 1 && response.data.address.isDefault === true) {
      logTest('Set Default Address - Basic', 'PASS', 
        'Default address set successfully, only one default exists', 
        { defaultCount, totalAddresses: allAddresses.length });
    } else {
      logTest('Set Default Address - Basic', 'FAIL', 
        `Multiple default addresses found: ${defaultCount}`, 
        { addresses: allAddresses });
    }
  } else {
    logTest('Set Default Address - Basic', 'FAIL', 
      `Failed to set default. Status: ${response.status}`, response.data);
  }
  
  // Test 5.2: Verify other addresses lose default status
  console.log('\n--- Test 5.2: Verify other addresses lose default status ---');
  
  await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${address2.id}/default`,
    token
  );
  
  const allAddresses = await prisma.address.findMany({
    where: { userId }
  });
  const defaultCount = allAddresses.filter(a => a.isDefault).length;
  const newDefault = allAddresses.find(a => a.id === address2.id);
  const oldDefault = allAddresses.find(a => a.id === address1.id);
  
  if (defaultCount === 1 && newDefault?.isDefault === true && oldDefault?.isDefault === false) {
    logTest('Set Default Address - Switch Default', 'PASS', 
      'Successfully switched default, old address lost default status', 
      { newDefault, oldDefault });
  } else {
    logTest('Set Default Address - Switch Default', 'FAIL', 
      'Failed to properly switch default address', 
      { defaultCount, addresses: allAddresses });
  }
  
  // Test 5.3: Set non-existent address as default
  console.log('\n--- Test 5.3: Set non-existent address as default ---');
  
  const fakeAddressId = '00000000-0000-0000-0000-000000000000';
  
  const responseFake = await apiRequest(
    'PUT',
    `/api/v1/users/${userId}/addresses/${fakeAddressId}/default`,
    token
  );
  
  if (responseFake.status === 404) {
    logTest('Set Default Address - Non-existent', 'PASS', 
      'Correctly returns 404 for non-existent address', responseFake.data);
  } else {
    logTest('Set Default Address - Non-existent', 'FAIL', 
      'Should return 404 for non-existent address', 
      { status: responseFake.status, data: responseFake.data });
  }
  
  // Cleanup
  await prisma.address.delete({ where: { id: address1.id } });
  await prisma.address.delete({ where: { id: address2.id } });
}

// ============================================================================
// TEST SUITE 6: Database Constraints and Relationships
// ============================================================================
async function testDatabaseConstraints(userId) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 6: Database Constraints and Relationships');
  console.log('='.repeat(70));
  
  // Test 6.1: Verify Address table exists with correct schema
  console.log('\n--- Test 6.1: Verify Address table schema ---');
  
  try {
    const address = await prisma.address.create({
      data: {
        userId,
        type: 'SHIPPING',
        firstName: 'Schema',
        lastName: 'Test',
        phone: '+8801712345678',
        address: 'House 1',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Dhanmondi',
        postalCode: '1205',
        isDefault: false
      }
    });
    
    // Verify all expected fields exist
    const expectedFields = [
      'id', 'userId', 'type', 'firstName', 'lastName', 'phone',
      'address', 'addressLine2', 'city', 'district', 'division',
      'upazila', 'postalCode', 'isDefault'
    ];
    
    const missingFields = expectedFields.filter(field => !(field in address));
    
    if (missingFields.length === 0) {
      logTest('Database - Address Schema', 'PASS', 
        'Address table has all expected fields', { expectedFields });
    } else {
      logTest('Database - Address Schema', 'FAIL', 
        'Address table is missing fields', { missingFields });
    }
    
    await prisma.address.delete({ where: { id: address.id } });
  } catch (error) {
    logTest('Database - Address Schema', 'FAIL', 
      `Error verifying schema: ${error.message}`, error);
  }
  
  // Test 6.2: Verify only one default address per user
  console.log('\n--- Test 6.2: Verify only one default address per user ---');
  
  try {
    // Create multiple addresses with isDefault: true
    const address1 = await prisma.address.create({
      data: {
        userId,
        type: 'SHIPPING',
        firstName: 'Default',
        lastName: 'One',
        phone: '+8801712345678',
        address: 'House 1',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Dhanmondi',
        postalCode: '1205',
        isDefault: true
      }
    });
    
    const address2 = await prisma.address.create({
      data: {
        userId,
        type: 'BILLING',
        firstName: 'Default',
        lastName: 'Two',
        phone: '+8801812345678',
        address: 'House 2',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Gulshan',
        postalCode: '1212',
        isDefault: true
      }
    });
    
    // Check if backend enforces single default
    const allAddresses = await prisma.address.findMany({
      where: { userId }
    });
    const defaultCount = allAddresses.filter(a => a.isDefault).length;
    
    if (defaultCount === 1) {
      logTest('Database - Single Default', 'PASS', 
        'Backend enforces only one default address per user', 
        { defaultCount });
    } else {
      logTest('Database - Single Default', 'FAIL', 
        `Multiple default addresses found: ${defaultCount}`, 
        { addresses: allAddresses });
    }
    
    await prisma.address.delete({ where: { id: address1.id } });
    await prisma.address.delete({ where: { id: address2.id } });
  } catch (error) {
    logTest('Database - Single Default', 'FAIL', 
      `Error: ${error.message}`, error);
  }
  
  // Test 6.3: Verify address-order relationship
  console.log('\n--- Test 6.3: Verify address-order relationship ---');
  
  try {
    const address = await prisma.address.create({
      data: {
        userId,
        type: 'SHIPPING',
        firstName: 'Order',
        lastName: 'Test',
        phone: '+8801712345678',
        address: 'House 1',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Dhanmondi',
        postalCode: '1205',
        isDefault: false
      }
    });
    
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        total: 1000,
        subtotal: 1000,
        status: 'PENDING',
        orderNumber: `ORD-${Date.now()}`,
        paymentMethod: 'CASH_ON_DELIVERY'
      }
    });
    
    // Verify relationship
    const addressWithOrders = await prisma.address.findUnique({
      where: { id: address.id },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    
    if (addressWithOrders._count.orders === 1) {
      logTest('Database - Address-Order Relationship', 'PASS', 
        'Address-order relationship works correctly', 
        { orderCount: addressWithOrders._count.orders });
    } else {
      logTest('Database - Address-Order Relationship', 'FAIL', 
        'Address-order relationship not working correctly', 
        { orderCount: addressWithOrders._count.orders });
    }
    
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: address.id } });
  } catch (error) {
    logTest('Database - Address-Order Relationship', 'FAIL', 
      `Error: ${error.message}`, error);
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        BANGLADESH ADDRESS MANAGEMENT - COMPREHENSIVE TEST SUITE            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`👤 Test Email: ${TEST_USER_EMAIL}`);
  
  let user = null;
  let token = null;
  let testAddress = null;
  
  try {
    // Create test user and login
    user = await createTestUser();
    token = await loginAndGetToken(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    
    if (!token) {
      console.error('\n❌ Failed to get authentication token. Exiting tests.');
      return;
    }
    
    console.log('\n✅ Authentication successful');
    
    // Run all test suites
    await testCreateAddress(user.id, token);
    await testCreateDefaultAddress(user.id, token);
    await testCreateMissingFields(user.id, token);
    await testCreateInvalidDivision(user.id, token);
    await testCreateInvalidPostalCode(user.id, token);
    await testAllValidDivisions(user.id, token);
    
    const addresses = await testGetAddresses(user.id, token);
    if (addresses.length > 0) {
      testAddress = addresses[0];
      await testUpdateAddress(user.id, token, testAddress.id);
      await testUpdateToDefault(user.id, token, testAddress.id);
    }
    
    await testUpdateNonExistent(user.id, token);
    
    if (testAddress) {
      await testDeleteAddress(user.id, token, testAddress.id);
    }
    
    await testDeleteAddressWithOrders(user.id, token);
    await testDeleteNonExistent(user.id, token);
    
    await testSetDefaultAddress(user.id, token);
    
    await testDatabaseConstraints(user.id);
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nTotal Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed / testResults.total) * 100).toFixed(1)}%)`);
    console.log(`⏭️ Skipped: ${testResults.skipped} (${((testResults.skipped / testResults.total) * 100).toFixed(1)}%)`);
    
    // Print failed tests
    if (testResults.failed > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('FAILED TESTS:');
      console.log('─'.repeat(70));
      testResults.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => {
          console.log(`\n❌ ${t.name}`);
          console.log(`   ${t.message}`);
          if (t.details) {
            console.log(`   Details:`, JSON.stringify(t.details, null, 2));
          }
        });
    }
    
    // Overall status
    const successRate = (testResults.passed / testResults.total) * 100;
    console.log('\n' + '='.repeat(70));
    console.log('OVERALL STATUS:');
    console.log('='.repeat(70));
    
    if (successRate >= 90) {
      console.log('✅ WORKING - Feature is fully functional');
    } else if (successRate >= 70) {
      console.log('⚠️ PARTIALLY WORKING - Feature has some issues');
    } else if (successRate >= 50) {
      console.log('❌ MAJOR ISSUES - Feature has significant problems');
    } else {
      console.log('🔴 NOT WORKING - Feature is non-functional');
    }
    
    console.log(`\nSuccess Rate: ${successRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
  } finally {
    // Cleanup
    if (user) {
      await cleanupTestData(user.id);
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('TEST EXECUTION COMPLETED');
    console.log('═'.repeat(70) + '\n');
  }
}

// Run tests
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
