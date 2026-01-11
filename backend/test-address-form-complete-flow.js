const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAddressFormFlow() {
  console.log('\n=== ADDRESS FORM COMPLETE FLOW TEST ===\n');

  try {
    // Step 1: Get a sample address from database
    const addresses = await prisma.address.findMany({
      take: 1,
      orderBy: { isDefault: 'desc' }
    });

    if (addresses.length === 0) {
      console.log('❌ No addresses found in database');
      console.log('Please create an address first using the web interface');
      return;
    }

    const testAddress = addresses[0];
    console.log('\n✓ Test Address Found:');
    console.log('  ID:', testAddress.id);
    console.log('  Division:', testAddress.division, '(Type:', typeof testAddress.division, ')');
    console.log('  District:', testAddress.district, '(Type:', typeof testAddress.district, ')');
    console.log('  Upazila:', testAddress.upazila, '(Type:', typeof testAddress.upazila, ')');
    console.log('  City:', testAddress.city);

    // Step 2: Verify data format
    console.log('\n=== DATA FORMAT VERIFICATION ===');
    
    const divisionIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const divisionNames = ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'];
    
    const isDivisionId = divisionIds.includes(testAddress.division);
    const isDivisionName = divisionNames.includes(testAddress.division);
    
    console.log('Division format analysis:');
    console.log('  Is ID (e.g., "3"):', isDivisionId);
    console.log('  Is NAME (e.g., "DHAKA"):', isDivisionName);
    console.log('  Expected format: NAME (for backend validation)');
    
    if (!isDivisionName) {
      console.log('⚠️  WARNING: Division is not in expected NAME format');
    } else {
      console.log('✓ Division is in correct NAME format');
    }

    const isDistrictId = /^\d+$/.test(testAddress.district);
    const isUpazilaId = /^\d+$/.test(testAddress.upazila);
    
    console.log('\nDistrict format analysis:');
    console.log('  Is ID (numeric string):', isDistrictId);
    console.log('  Expected format: ID (for frontend Select)');
    
    console.log('\nUpazila format analysis:');
    console.log('  Is ID (numeric string):', isUpazilaId);
    console.log('  Expected format: ID (for frontend Select)');

    if (isDistrictId && isUpazilaId) {
      console.log('✓ District and Upazila are in correct ID format');
    } else {
      console.log('⚠️  WARNING: District or Upazila may not be in ID format');
    }

    // Step 3: Test data conversion (simulating frontend logic)
    console.log('\n=== FRONTEND DATA CONVERSION TEST ===');
    
    // Simulate getDivisionById function
    const divisions = [
      { id: '1', name: 'Barishal', nameBn: 'বরিশাল' },
      { id: '2', name: 'Chattogram', nameBn: 'চট্টগ্রাম' },
      { id: '3', name: 'Dhaka', nameBn: 'ঢাকা' },
      { id: '4', name: 'Khulna', nameBn: 'খুলনা' },
      { id: '5', name: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
      { id: '6', name: 'Rajshahi', nameBn: 'রাজশাহী' },
      { id: '7', name: 'Rangpur', nameBn: 'রংপুর' },
      { id: '8', name: 'Sylhet', nameBn: 'সিলেট' }
    ];

    const getDivisionById = (id) => divisions.find(d => d.id === id);
    
    // Test conversion: Division NAME to ID
    const divisionName = testAddress.division; // e.g., "DHAKA"
    const divisionId = getDivisionById(divisionName); // Should find ID "3"
    
    console.log('Division name from DB:', divisionName);
    console.log('Division ID after conversion:', divisionId);
    
    if (divisionId) {
      console.log('✓ Division conversion successful:', divisionName, '->', divisionId.id);
    } else {
      console.log('❌ Division conversion FAILED:', divisionName, '-> undefined');
    }

    // Step 4: Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ Database contains address data');
    console.log('✓ Division format:', isDivisionName ? 'NAME (correct)' : 'ID (incorrect)');
    console.log('✓ District format:', isDistrictId ? 'ID (correct)' : 'non-ID (incorrect)');
    console.log('✓ Upazila format:', isUpazilaId ? 'ID (correct)' : 'non-ID (incorrect)');
    console.log('✓ Division conversion:', divisionId ? 'SUCCESS' : 'FAILED');

    if (isDivisionName && isDistrictId && isUpazilaId && divisionId) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('\nFrontend should:');
      console.log('  1. Load address from backend');
      console.log('  2. Convert division NAME to ID for display');
      console.log('  3. Use district and upazila IDs directly (no conversion needed)');
      console.log('  4. Set form data with:');
      console.log('     - division: ID (for Select component)');
      console.log('     - district: ID (for Select component)');
      console.log('     - upazila: ID (for Select component)');
      console.log('\nWhen submitting:');
      console.log('  1. Convert division ID back to NAME for backend validation');
      console.log('  2. Send district and upazila as IDs');
      console.log('\nExpected behavior:');
      console.log('  - Division dropdown should show: "Dhaka" (selected)');
      console.log('  - District dropdown should show: "Dhaka" (selected)');
      console.log('  - Upazila dropdown should show: "Savar" (selected)');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('\nPlease check:');
      console.log('  1. Database schema and data format');
      console.log('  2. Frontend conversion logic');
      console.log('  3. Backend validation rules');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAddressFormFlow();
