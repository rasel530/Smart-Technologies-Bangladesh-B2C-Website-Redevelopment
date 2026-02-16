/**
 * Simple Wishlist Endpoint Verification Script
 * 
 * Quick verification that GET /api/v1/wishlist returns 200 (not 404)
 */

const request = require('supertest');
const app = require('../index');

async function verifyWishlistEndpoint() {
  console.log('\n=== Wishlist Endpoint Verification ===\n');
  
  // Test 1: Verify endpoint exists (not 404)
  console.log('Test 1: Checking if GET /api/v1/wishlist endpoint exists...');
  const response1 = await request(app)
    .get('/api/v1/wishlist')
    .set('Accept', 'application/json');
  
  const endpointExists = response1.status !== 404;
  console.log(`  Status Code: ${response1.status}`);
  console.log(`  Result: ${endpointExists ? '✅ PASS - Endpoint exists' : '❌ FAIL - Endpoint returns 404'}\n`);
  
  // Test 2: Verify old plural endpoint returns 404
  console.log('Test 2: Checking if old plural endpoint /api/v1/wishlists returns 404...');
  const response2 = await request(app)
    .get('/api/v1/wishlists')
    .set('Accept', 'application/json');
  
  const oldEndpointDeprecated = response2.status === 404;
  console.log(`  Status Code: ${response2.status}`);
  console.log(`  Result: ${oldEndpointDeprecated ? '✅ PASS - Old endpoint deprecated' : '❌ FAIL - Old endpoint still accessible'}\n`);
  
  // Summary
  console.log('=== Summary ===');
  console.log(`GET /api/v1/wishlist endpoint exists: ${endpointExists ? '✅ YES' : '❌ NO'}`);
  console.log(`Old plural endpoint deprecated: ${oldEndpointDeprecated ? '✅ YES' : '❌ NO'}`);
  
  if (endpointExists && oldEndpointDeprecated) {
    console.log('\n✅ VERDICT: The 404 error has been FIXED!\n');
  } else {
    console.log('\n❌ VERDICT: The 404 error issue may still exist.\n');
  }
  
  return {
    endpointExists,
    oldEndpointDeprecated,
    newEndpointStatus: response1.status,
    oldEndpointStatus: response2.status
  };
}

// Run verification
if (require.main === module) {
  verifyWishlistEndpoint()
    .then(results => {
      process.exit(results.endpointExists ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = { verifyWishlistEndpoint };
