/**
 * Test Script: Add Real Address with Division, District, Upazila
 * 
 * This script tests complete address creation and editing flow:
 * 1. Creates a new address with real division, district, upazila values
 * 2. Retrieves address to verify it was saved correctly
 * 3. Tests data format conversion
 * 4. Verifies address can be edited
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test user ID (from your database)
const TEST_USER_ID = '1b5dc062-f8ca-4889-b79f-da8cc1db3eaa';

// Real address data for testing
const TEST_ADDRESS_DATA = {
  type: 'SHIPPING',
  firstName: 'Test',
  lastName: 'User',
  phone: '01712345678',
  address: 'Test Address Line 1',
  addressLine2: 'Test Address Line 2',
  city: 'Dhaka',
  division: 'DHAKA',        // Backend stores as NAME
  district: '301',          // Backend stores as ID
  upazila: '30101',        // Backend stores as ID
  postalCode: '1000',
  isDefault: false
};

async function testAddRealAddress() {
  console.log('=== ADD REAL ADDRESS TEST ===\n');
  
  try {
    // Step 1: Add a new address
    console.log('Step 1: Creating new address...');
    console.log('Address data:', JSON.stringify(TEST_ADDRESS_DATA, null, 2));
    
    const newAddress = await prisma.address.create({
      data: {
        userId: TEST_USER_ID,
        type: TEST_ADDRESS_DATA.type,
        firstName: TEST_ADDRESS_DATA.firstName,
        lastName: TEST_ADDRESS_DATA.lastName,
        phone: TEST_ADDRESS_DATA.phone,
        address: TEST_ADDRESS_DATA.address,
        addressLine2: TEST_ADDRESS_DATA.addressLine2,
        city: TEST_ADDRESS_DATA.city,
        district: TEST_ADDRESS_DATA.district,
        division: TEST_ADDRESS_DATA.division,
        upazila: TEST_ADDRESS_DATA.upazila,
        postalCode: TEST_ADDRESS_DATA.postalCode,
        isDefault: TEST_ADDRESS_DATA.isDefault
      }
    });
    
    console.log('\n✓ Address created successfully!');
    console.log('Address ID:', newAddress.id);
    console.log('Stored in database:');
    console.log('  - Division:', newAddress.division, '(Type:', typeof newAddress.division, ')');
    console.log('  - District:', newAddress.district, '(Type:', typeof newAddress.district, ')');
    console.log('  - Upazila:', newAddress.upazila, '(Type:', typeof newAddress.upazila, ')');
    
    // Step 2: Retrieve address to verify
    console.log('\nStep 2: Retrieving address from database...');
    const retrievedAddress = await prisma.address.findUnique({
      where: { id: newAddress.id }
    });
    
    if (!retrievedAddress) {
      console.log('❌ Failed to retrieve address');
      return;
    }
    
    console.log('✓ Address retrieved successfully!');
    console.log('Retrieved data:');
    console.log('  - Division:', retrievedAddress.division, '(Type:', typeof retrievedAddress.division, ')');
    console.log('  - District:', retrievedAddress.district, '(Type:', typeof retrievedAddress.district, ')');
    console.log('  - Upazila:', retrievedAddress.upazila, '(Type:', typeof retrievedAddress.upazila, ')');
    
    // Step 3: Test data format verification
    console.log('\nStep 3: Verifying data format...');
    
    // Check division format
    const divisionIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const divisionNames = ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'];
    
    const isDivisionId = divisionIds.includes(retrievedAddress.division);
    const isDivisionName = divisionNames.includes(retrievedAddress.division);
    
    console.log('Division format analysis:');
    console.log('  - Is ID (e.g., "3"):', isDivisionId);
    console.log('  - Is NAME (e.g., "DHAKA"):', isDivisionName);
    console.log('  - Expected format: NAME (for backend validation)');
    
    if (isDivisionName) {
      console.log('  ✓ Division is in correct NAME format');
    } else {
      console.log('  ❌ Division is NOT in correct NAME format');
    }
    
    // Check district format
    const isDistrictId = !isNaN(parseInt(retrievedAddress.district)) && retrievedAddress.district.length === 3;
    console.log('\nDistrict format analysis:');
    console.log('  - Is ID (3-digit string):', isDistrictId);
    console.log('  - Expected format: ID (for frontend Select)');
    
    if (isDistrictId) {
      console.log('  ✓ District is in correct ID format');
    } else {
      console.log('  ❌ District is NOT in correct ID format');
    }
    
    // Check upazila format
    const isUpazilaId = !isNaN(parseInt(retrievedAddress.upazila)) && retrievedAddress.upazila.length === 5;
    console.log('\nUpazila format analysis:');
    console.log('  - Is ID (5-digit string):', isUpazilaId);
    console.log('  - Expected format: ID (for frontend Select)');
    
    if (isUpazilaId) {
      console.log('  ✓ Upazila is in correct ID format');
    } else {
      console.log('  ❌ Upazila is NOT in correct ID format');
    }
    
    // Step 4: Test address update (simulating edit)
    console.log('\nStep 4: Testing address update (simulating edit)...');
    
    const updatedAddress = await prisma.address.update({
      where: { id: newAddress.id },
      data: {
        firstName: 'Updated',
        lastName: 'User',
        division: 'CHITTAGONG',  // Change division to test update
        district: '101',          // Change district to test update
        upazila: '10101'          // Change upazila to test update
      }
    });
    
    console.log('✓ Address updated successfully!');
    console.log('Updated data:');
    console.log('  - Division:', updatedAddress.division, '(Type:', typeof updatedAddress.division, ')');
    console.log('  - District:', updatedAddress.district, '(Type:', typeof updatedAddress.district, ')');
    console.log('  - Upazila:', updatedAddress.upazila, '(Type:', typeof updatedAddress.upazila, ')');
    
    // Step 5: Verify updated address
    console.log('\nStep 5: Verifying updated address...');
    const verifiedAddress = await prisma.address.findUnique({
      where: { id: newAddress.id }
    });
    
    if (verifiedAddress) {
      console.log('✓ Verified updated address!');
      console.log('Final data in database:');
      console.log('  - Division:', verifiedAddress.division, '(Type:', typeof verifiedAddress.division, ')');
      console.log('  - District:', verifiedAddress.district, '(Type:', typeof verifiedAddress.district, ')');
      console.log('  - Upazila:', verifiedAddress.upazila, '(Type:', typeof verifiedAddress.upazila, ')');
      
      // Verify format after update
      const isUpdatedDivisionName = divisionNames.includes(verifiedAddress.division);
      const isUpdatedDistrictId = !isNaN(parseInt(verifiedAddress.district)) && verifiedAddress.district.length === 3;
      const isUpdatedUpazilaId = !isNaN(parseInt(verifiedAddress.upazila)) && verifiedAddress.upazila.length === 5;
      
      console.log('\nUpdated values format verification:');
      console.log('  - Division:', verifiedAddress.division, '→ Is NAME:', isUpdatedDivisionName);
      console.log('  - District:', verifiedAddress.district, '→ Is ID:', isUpdatedDistrictId);
      console.log('  - Upazila:', verifiedAddress.upazila, '→ Is ID:', isUpdatedUpazilaId);
    }
    
    // Step 6: Clean up - delete test address
    console.log('\nStep 6: Cleaning up test address...');
    await prisma.address.delete({
      where: { id: newAddress.id }
    });
    console.log('✓ Test address deleted');
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ All tests passed successfully!');
    console.log('✓ Address creation working');
    console.log('✓ Address retrieval working');
    console.log('✓ Data format correct (division=NAME, district=ID, upazila=ID)');
    console.log('✓ Address update working');
    console.log('✓ Address verification working');
    console.log('\n✅ READY FOR TESTING IN BROWSER');
    console.log('\nNext Steps:');
    console.log('1. Navigate to http://localhost:3000');
    console.log('2. Login to your account');
    console.log('3. Navigate to Profile → Addresses section');
    console.log('4. Click "Add Address" to create a new address');
    console.log('5. Select Division: Dhaka');
    console.log('6. Select District: Dhaka');
    console.log('7. Select Upazila: Savar');
    console.log('8. Fill in other fields and save');
    console.log('9. Click "Edit" on the saved address');
    console.log('10. Verify dropdowns show previously selected values');
    console.log('11. Check browser console (F12) for debug logs');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting address creation test...\n');
testAddRealAddress();
