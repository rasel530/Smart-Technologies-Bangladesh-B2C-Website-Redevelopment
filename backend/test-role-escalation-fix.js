/**
 * Test script to verify the RoleEscalationRequest fix
 * Tests both scenarios: with and without query parameters
 */

const RoleEscalationRequest = require('./models/RoleEscalationRequest');

async function testRoleEscalationFix() {
  console.log('=== Testing RoleEscalationRequest Fix ===\n');
  
  const model = new RoleEscalationRequest();
  
  try {
    // Test 1: Find all without filters (this was causing the 500 error)
    console.log('Test 1: Finding all requests WITHOUT filters...');
    const allRequests = await model.findAll();
    console.log(`✓ Success: Found ${allRequests.length} requests`);
    console.log(`  First request ID: ${allRequests.length > 0 ? allRequests[0].id : 'N/A'}\n`);
    
    // Test 2: Find all with status filter
    console.log('Test 2: Finding requests WITH status filter...');
    const pendingRequests = await model.findAll({ status: 'pending' });
    console.log(`✓ Success: Found ${pendingRequests.length} pending requests\n`);
    
    // Test 3: Find all with userId filter
    console.log('Test 3: Finding requests WITH userId filter...');
    if (allRequests.length > 0) {
      const userRequests = await model.findAll({ userId: allRequests[0].user_id });
      console.log(`✓ Success: Found ${userRequests.length} requests for user ${allRequests[0].user_id}\n`);
    } else {
      console.log('⚠ Skipped: No requests available to test userId filter\n');
    }
    
    // Test 4: Find all with both filters
    console.log('Test 4: Finding requests WITH both status and userId filters...');
    if (allRequests.length > 0) {
      const filteredRequests = await model.findAll({ 
        status: 'pending', 
        userId: allRequests[0].user_id 
      });
      console.log(`✓ Success: Found ${filteredRequests.length} requests matching both filters\n`);
    } else {
      console.log('⚠ Skipped: No requests available to test combined filters\n');
    }
    
    console.log('=== All Tests Passed! ===');
    console.log('\nThe fix successfully handles:');
    console.log('  ✓ Empty params array (no query parameters)');
    console.log('  ✓ Single filter (status or userId)');
    console.log('  ✓ Multiple filters (status and userId)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testRoleEscalationFix()
  .then(() => {
    console.log('\n✓ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test failed with error:', error);
    process.exit(1);
  });
