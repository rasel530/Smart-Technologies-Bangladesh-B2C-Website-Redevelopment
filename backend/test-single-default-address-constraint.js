/**
 * Test script to verify the single default address constraint
 * 
 * This script tests that:
 * 1. A user can have one default address (should succeed)
 * 2. A user cannot have multiple default addresses (should fail at database level)
 * 3. A user can have multiple non-default addresses (should succeed)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSingleDefaultAddressConstraint() {
  console.log('='.repeat(60));
  console.log('Testing Single Default Address Constraint');
  console.log('='.repeat(60));

  let testUser = null;
  let address1 = null;
  let address2 = null;
  let address3 = null;

  try {
    // Step 1: Create a test user
    console.log('\n[Step 1] Creating test user...');
    testUser = await prisma.user.create({
      data: {
        email: `test-constraint-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword123',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
    console.log(`✓ Test user created: ${testUser.id}`);

    // Step 2: Create first default address (should succeed)
    console.log('\n[Step 2] Creating first default address...');
    address1 = await prisma.address.create({
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
    console.log(`✓ First default address created: ${address1.id}`);
    console.log(`  isDefault: ${address1.isDefault}`);

    // Step 3: Try to create second default address (should fail)
    console.log('\n[Step 3] Attempting to create second default address (should fail)...');
    try {
      address2 = await prisma.address.create({
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
      console.log(`✗ FAILED: Second default address was created (constraint not working): ${address2.id}`);
      console.log('  This should NOT have happened!');
    } catch (error) {
      console.log(`✓ Expected error occurred: ${error.code}`);
      console.log(`  Error message: ${error.message}`);
      
      // Check if it's the expected constraint violation
      if (error.code === 'P2002') {
        console.log('  ✓ Correct: Unique constraint violation (P2002)');
      } else if (error.message.includes('unique_default_address_per_user')) {
        console.log('  ✓ Correct: Constraint name matches');
      } else {
        console.log(`  ⚠ Warning: Unexpected error code - ${error.code}`);
      }
    }

    // Step 4: Create a non-default address (should succeed)
    console.log('\n[Step 4] Creating non-default address (should succeed)...');
    try {
      address3 = await prisma.address.create({
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
      console.log(`✓ Non-default address created: ${address3.id}`);
      console.log(`  isDefault: ${address3.isDefault}`);
    } catch (error) {
      console.log(`✗ FAILED: Could not create non-default address: ${error.message}`);
    }

    // Step 5: Verify current addresses
    console.log('\n[Step 5] Verifying current addresses for user...');
    const addresses = await prisma.address.findMany({
      where: { userId: testUser.id },
      orderBy: { id: 'asc' }
    });

    console.log(`Total addresses: ${addresses.length}`);
    addresses.forEach((addr, index) => {
      console.log(`  Address ${index + 1}: ${addr.id}`);
      console.log(`    Type: ${addr.type}, isDefault: ${addr.isDefault}`);
      console.log(`    Address: ${addr.address}`);
    });

    // Count default addresses
    const defaultCount = addresses.filter(a => a.isDefault).length;
    console.log(`\nDefault address count: ${defaultCount}`);
    if (defaultCount === 1) {
      console.log('✓ Correct: Only one default address exists');
    } else {
      console.log(`✗ FAILED: Expected 1 default address, found ${defaultCount}`);
    }

  } catch (error) {
    console.error('\n✗ Test failed with unexpected error:', error);
  } finally {
    // Cleanup
    console.log('\n[Cleanup] Removing test data...');
    try {
      if (testUser) {
        // Delete addresses first (foreign key constraint)
        await prisma.address.deleteMany({
          where: { userId: testUser.id }
        });
        console.log('✓ Test addresses deleted');

        // Delete user
        await prisma.user.delete({
          where: { id: testUser.id }
        });
        console.log('✓ Test user deleted');
      }
    } catch (error) {
      console.log(`⚠ Cleanup warning: ${error.message}`);
    }

    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed');
  console.log('='.repeat(60));
}

// Run the test
testSingleDefaultAddressConstraint()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
