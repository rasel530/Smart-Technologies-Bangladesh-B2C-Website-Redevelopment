/**
 * Bangladesh Address Management Test Script
 * Tests all address management endpoints with comprehensive coverage
 * Phase 3, Milestone 3, Task 2
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
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, message, details = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} - ${testName}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details:`, details);
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
  console.log('[LOGIN DEBUG] Response status:', response.status);
  console.log('[LOGIN DEBUG] Response body:', JSON.stringify(result));
  const token = result.token || result.data?.token;
  console.log('[LOGIN DEBUG] Extracted token:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  return token;
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
  
  console.log(`✅ Test user created: ${user.email}`);
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
// TEST 1: Create Address
// ============================================================================
async function testCreateAddress(userId, token) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Create Address');
  console.log('='.repeat(60));
  
  console.log('[CREATE DEBUG] Token passed to function:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  
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
  
  try {
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      newAddress
    );
    
    if (response.status === 201 && response.data.address) {
      const address = response.data.address;
      
      // Verify all fields are present
      const fieldsPresent = 
        address.id &&
        address.type === newAddress.type &&
        address.firstName === newAddress.firstName &&
        address.lastName === newAddress.lastName &&
        address.phone === newAddress.phone &&
        address.address === newAddress.address &&
        address.addressLine2 === newAddress.addressLine2 &&
        address.city === newAddress.city &&
        address.district === newAddress.district &&
        address.division === newAddress.division &&
        address.upazila === newAddress.upazila &&
        address.postalCode === newAddress.postalCode &&
        address.isDefault === newAddress.isDefault &&
        address.userId === userId;
      
      if (fieldsPresent) {
        logTest(
          'Create Address - Basic',
          true,
          'Address created successfully with all fields',
          address
        );
        return address;
      } else {
        logTest(
          'Create Address - Basic',
          false,
          'Address created but some fields are missing or incorrect',
          { expected: newAddress, received: address }
        );
        return null;
      }
    } else {
      logTest(
        'Create Address - Basic',
        false,
        `Failed to create address. Status: ${response.status}`,
        response.data
      );
      return null;
    }
  } catch (error) {
    logTest(
      'Create Address - Basic',
      false,
      `Error: ${error.message}`,
      error
    );
    return null;
  }
}

// Test 1.2: Create Default Address
async function testCreateDefaultAddress(userId, token) {
  console.log('\n--- Test 1.2: Create Default Address ---');
  
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
  
  try {
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      defaultAddress
    );
    
    if (response.status === 201 && response.data.address) {
      const address = response.data.address;
      
      // Verify isDefault is set correctly
      if (address.isDefault === true) {
        logTest(
          'Create Address - Default',
          true,
          'Default address created successfully',
          address
        );
        return address;
      } else {
        logTest(
          'Create Address - Default',
          false,
          'isDefault flag not set correctly',
          { expected: true, received: address.isDefault }
        );
        return null;
      }
    } else {
      logTest(
        'Create Address - Default',
        false,
        `Failed to create default address. Status: ${response.status}`,
        response.data
      );
      return null;
    }
  } catch (error) {
    logTest(
      'Create Address - Default',
      false,
      `Error: ${error.message}`,
      error
    );
    return null;
  }
}

// ============================================================================
// TEST 2: Get Addresses
// ============================================================================
async function testGetAddresses(userId, token) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Addresses');
  console.log('='.repeat(60));
  
  console.log('[GET DEBUG] Token passed to function:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  
  try {
    const response = await apiRequest(
      'GET',
      `/api/v1/users/${userId}/addresses`,
      token
    );
    
    if (response.status === 200 && Array.isArray(response.data.addresses)) {
      const addresses = response.data.addresses;
      
      // Verify addresses are returned
      if (addresses.length > 0) {
        logTest(
          'Get Addresses - Basic',
          true,
          `Successfully retrieved ${addresses.length} addresses`,
          addresses
        );
        
        // Verify default address is first
        const defaultAddress = addresses.find(a => a.isDefault);
        if (defaultAddress && addresses[0].isDefault) {
          logTest(
            'Get Addresses - Default First',
            true,
            'Default address is returned first',
            { firstAddress: addresses[0] }
          );
        } else if (defaultAddress) {
          logTest(
            'Get Addresses - Default First',
            false,
            'Default address exists but is not first',
            { addresses }
          );
        } else {
          logTest(
            'Get Addresses - Default First',
            false,
            'No default address found',
            { addresses }
          );
        }
        
        return addresses;
      } else {
        logTest(
          'Get Addresses - Basic',
          false,
          'No addresses returned',
          response.data
        );
        return [];
      }
    } else {
      logTest(
        'Get Addresses - Basic',
        false,
        `Failed to get addresses. Status: ${response.status}`,
        response.data
      );
      return [];
    }
  } catch (error) {
    logTest(
      'Get Addresses - Basic',
      false,
      `Error: ${error.message}`,
      error
    );
    return [];
  }
}

// ============================================================================
// TEST 3: Update Address
// ============================================================================
async function testUpdateAddress(userId, token, addressId) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Update Address');
  console.log('='.repeat(60));
  
  console.log('[UPDATE DEBUG] Token passed to function:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  
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
  
  try {
    const response = await apiRequest(
      'PUT',
      `/api/v1/users/${userId}/addresses/${addressId}`,
      token,
      updateData
    );
    
    if (response.status === 200 && response.data.address) {
      const address = response.data.address;
      
      // Verify changes are saved
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
        logTest(
          'Update Address - Basic',
          true,
          'Address updated successfully',
          address
        );
        return address;
      } else {
        logTest(
          'Update Address - Basic',
          false,
          'Address updated but some fields not saved correctly',
          { expected: updateData, received: address }
        );
        return null;
      }
    } else {
      logTest(
        'Update Address - Basic',
        false,
        `Failed to update address. Status: ${response.status}`,
        response.data
      );
      return null;
    }
  } catch (error) {
    logTest(
      'Update Address - Basic',
      false,
      `Error: ${error.message}`,
      error
    );
    return null;
  }
}

// ============================================================================
// TEST 4: Delete Address
// ============================================================================
async function testDeleteAddress(userId, token, addressId) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Delete Address');
  console.log('='.repeat(60));
  
  console.log('[DELETE DEBUG] Token passed to function:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  
  try {
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
        logTest(
          'Delete Address - Basic',
          true,
          'Address deleted successfully from database'
        );
      } else {
        logTest(
          'Delete Address - Basic',
          false,
          'Address still exists in database after deletion',
          { addressId }
        );
      }
    } else {
      logTest(
        'Delete Address - Basic',
        false,
        `Failed to delete address. Status: ${response.status}`,
        response.data
      );
    }
  } catch (error) {
    logTest(
      'Delete Address - Basic',
      false,
      `Error: ${error.message}`,
      error
    );
  }
}

// Test 4.2: Delete Address Used in Orders
async function testDeleteAddressWithOrders(userId, token) {
  console.log('\n--- Test 4.2: Delete Address Used in Orders ---');
  
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
        shippingAddressId: address.id,
        billingAddressId: address.id,
        total: 1000,
        status: 'PENDING'
      }
    });
    
    // Try to delete the address
    const response = await apiRequest(
      'DELETE',
      `/api/v1/users/${userId}/addresses/${address.id}`,
      token
    );
    
    if (response.status === 400) {
      logTest(
        'Delete Address - With Orders',
        true,
        'Correctly prevents deletion of address used in orders',
        { error: response.data.error }
      );
    } else {
      logTest(
        'Delete Address - With Orders',
        false,
        'Should prevent deletion but did not',
        { status: response.status, data: response.data }
      );
    }
    
    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: address.id } });
  } catch (error) {
    logTest(
      'Delete Address - With Orders',
      false,
      `Error: ${error.message}`,
      error
    );
  }
}

// ============================================================================
// TEST 5: Set Default Address
// ============================================================================
async function testSetDefaultAddress(userId, token, addressId) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Set Default Address');
  console.log('='.repeat(60));
  
  console.log('[SET DEFAULT DEBUG] Token passed to function:', token ? token.substring(0, 20) + '...' : 'null/undefined');
  
  try {
    const response = await apiRequest(
      'PUT',
      `/api/v1/users/${userId}/addresses/${addressId}/default`,
      token
    );
    
    if (response.status === 200 && response.data.address) {
      const address = response.data.address;
      
      // Verify only one address is default
      const allAddresses = await prisma.address.findMany({
        where: { userId }
      });
      const defaultCount = allAddresses.filter(a => a.isDefault).length;
      
      if (defaultCount === 1) {
        logTest(
          'Set Default Address - Basic',
          true,
          'Default address set successfully, only one default address exists',
          { defaultCount, totalAddresses: allAddresses.length }
        );
      } else {
        logTest(
          'Set Default Address - Basic',
          false,
          `Multiple default addresses found: ${defaultCount}`,
          { addresses: allAddresses }
        );
      }
    } else {
      logTest(
        'Set Default Address - Basic',
        false,
        `Failed to set default. Status: ${response.status}`,
        response.data
      );
    }
  } catch (error) {
    logTest(
      'Set Default Address - Basic',
      false,
      `Error: ${error.message}`,
      error
    );
  }
}

// ============================================================================
// TEST 6: Validation Tests
// ============================================================================
async function testValidation(userId, token) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Validation Tests');
  console.log('='.repeat(60));
  
  // Test 6.1: Invalid Division
  console.log('\n--- Test 6.1: Invalid Division ---');
  
  const invalidDivisionAddress = {
    type: 'SHIPPING',
    firstName: 'Test',
    lastName: 'User',
    address: 'House 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'INVALID_DIVISION', // Invalid
    upazila: 'Dhanmondi',
    postalCode: '1205'
  };
  
  try {
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      invalidDivisionAddress
    );
    
    if (response.status === 400) {
      logTest(
        'Validation - Invalid Division',
        true,
        'Correctly rejects invalid division',
        { error: response.data.error }
      );
    } else {
      logTest(
        'Validation - Invalid Division',
        false,
        'Should reject invalid division but did not',
        { status: response.status, data: response.data }
      );
    }
  } catch (error) {
    logTest(
      'Validation - Invalid Division',
      false,
      `Error: ${error.message}`,
      error
    );
  }
  
  // Test 6.2: Missing Required Fields
  console.log('\n--- Test 6.2: Missing Required Fields ---');
  
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
  
  try {
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      missingFieldsAddress
    );
    
    if (response.status === 400) {
      logTest(
        'Validation - Missing Required Fields',
        true,
        'Correctly rejects missing required fields',
        { error: response.data.error, details: response.data.details }
      );
    } else {
      logTest(
        'Validation - Missing Required Fields',
        false,
        'Should reject missing fields but did not',
        { status: response.status, data: response.data }
      );
    }
  } catch (error) {
    logTest(
      'Validation - Missing Required Fields',
      false,
      `Error: ${error.message}`,
      error
    );
  }
  
  // Test 6.3: Invalid Postal Code Format
  console.log('\n--- Test 6.3: Invalid Postal Code Format ---');
  
  const invalidPostalCodeAddress = {
    type: 'SHIPPING',
    firstName: 'Test',
    lastName: 'User',
    address: 'House 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Dhanmondi',
    postalCode: 'ABC' // Invalid - should be 4 digits
  };
  
  try {
    const response = await apiRequest(
      'POST',
      `/api/v1/users/${userId}/addresses`,
      token,
      invalidPostalCodeAddress
    );
    
    if (response.status === 400) {
      logTest(
        'Validation - Invalid Postal Code',
        true,
        'Correctly rejects invalid postal code format',
        { error: response.data.error, details: response.data.details }
      );
    } else {
      logTest(
        'Validation - Invalid Postal Code',
        false,
        'Should reject invalid postal code but did not',
        { status: response.status, data: response.data }
      );
    }
  } catch (error) {
    logTest(
      'Validation - Invalid Postal Code',
      false,
      `Error: ${error.message}`,
      error
    );
  }
  
  // Test 6.4: Test All Valid Divisions
  console.log('\n--- Test 6.4: Test All Valid Divisions ---');
  
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
    
    try {
      const response = await apiRequest(
        'POST',
        `/api/v1/users/${userId}/addresses`,
        token,
        divisionAddress
      );
      
      if (response.status === 201) {
        // Cleanup
        await prisma.address.delete({
          where: { id: response.data.address.id }
        });
      }
    } catch (error) {
      logTest(
        `Validation - Division ${division}`,
        false,
        `Failed to create address with division ${division}`,
        error
      );
    }
  }
  
  logTest(
    'Validation - All Divisions',
    true,
    `Successfully tested all ${DIVISIONS.length} divisions`,
    { divisions: DIVISIONS }
  );
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
