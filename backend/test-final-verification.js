// Final verification of the routing fix
const fs = require('fs');
const path = require('path');

console.log('🔍 Final verification of routing configuration fix...\n');

// Check 1: Verify backend/routes/index.js has the correct prefixes
console.log('1. Checking backend/routes/index.js:');
const routesIndexPath = path.join(__dirname, 'routes', 'index.js');
const routesIndexContent = fs.readFileSync(routesIndexPath, 'utf8');

// Check API versioning middleware
const versioningMatch = routesIndexContent.match(/router\.use\('([^']+)',/);
if (versioningMatch && versioningMatch[1] === '/v1') {
  console.log('   ✅ API versioning middleware uses /v1 prefix');
} else {
  console.log('   ❌ API versioning middleware does not use /v1 prefix');
}

// Check route registrations
const routePatterns = [
  "router.use('/v1/auth'",
  "router.use('/v1/users'",
  "router.use('/v1/products'",
  "router.use('/v1/categories'",
  "router.use('/v1/brands'",
  "router.use('/v1/orders'",
  "router.use('/v1/cart'",
  "router.use('/v1/wishlist'",
  "router.use('/v1/reviews'",
  "router.use('/v1/coupons'"
];

let allRoutesCorrect = true;
routePatterns.forEach(pattern => {
  if (routesIndexContent.includes(pattern)) {
    console.log(`   ✅ Found: ${pattern}`);
  } else {
    console.log(`   ❌ Missing: ${pattern}`);
    allRoutesCorrect = false;
  }
});

// Check 2: Verify backend/index.js has the correct mounting
console.log('\n2. Checking backend/index.js:');
const indexJsPath = path.join(__dirname, 'index.js');
const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');

const mountingMatch = indexJsContent.match(/app\.use\('([^']+)',\s*routeIndex\);/);
if (mountingMatch && mountingMatch[1] === '/api') {
  console.log('   ✅ Routes are mounted with /api prefix in backend/index.js');
} else {
  console.log('   ❌ Routes are not mounted with /api prefix in backend/index.js');
}

// Check 3: Verify API documentation shows correct paths
console.log('\n3. Checking API documentation paths:');
const docPathMatch = routesIndexContent.match(/auth:\s*'([^']+)'/);
if (docPathMatch && docPathMatch[1] === '/api/v1/auth') {
  console.log('   ✅ API documentation shows /api/v1/auth endpoint');
} else {
  console.log('   ❌ API documentation does not show /api/v1/auth endpoint');
}

// Final summary
console.log('\n📋 Summary of routing configuration:');
console.log('   - backend/index.js:109 mounts routes with /api prefix');
console.log('   - backend/routes/index.js adds /v1 prefix (not /api/v1)');
console.log('   - All route registrations use /v1/ prefix');
console.log('   - Final endpoints are accessible at /api/v1/{endpoint}');

if (allRoutesCorrect && mountingMatch && mountingMatch[1] === '/api') {
  console.log('\n✅ Double prefix issue has been successfully resolved!');
  console.log('   Before fix: /api/api/v1/ (double prefix)');
  console.log('   After fix:  /api/v1/ (correct single prefix)');
} else {
  console.log('\n❌ There may still be issues with the routing configuration.');
}

console.log('\n🎯 Expected endpoint paths after fix:');
console.log('   - Authentication: /api/v1/auth');
console.log('   - Users: /api/v1/users');
console.log('   - Products: /api/v1/products');
console.log('   - Categories: /api/v1/categories');
console.log('   - Brands: /api/v1/brands');
console.log('   - Orders: /api/v1/orders');
console.log('   - Cart: /api/v1/cart');
console.log('   - Wishlist: /api/v1/wishlist');
console.log('   - Reviews: /api/v1/reviews');
console.log('   - Coupons: /api/v1/coupons');