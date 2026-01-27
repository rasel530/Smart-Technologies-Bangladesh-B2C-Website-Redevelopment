/**
 * Variant Management Endpoints Verification
 * 
 * This script verifies that all variant management endpoints exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('Variant Management Endpoints Verification');
console.log('========================================\n');

// Read the products.js file
const productsPath = path.join(__dirname, 'routes/products.js');
const productsContent = fs.readFileSync(productsPath, 'utf8');

// Define expected endpoints
const expectedEndpoints = [
  // ProductVariant CRUD
  { method: 'POST', path: '/:id/variants', description: 'Create product variant' },
  { method: 'PUT', path: '/:id/variants/:variantId', description: 'Update product variant' },
  { method: 'DELETE', path: '/:id/variants/:variantId', description: 'Delete product variant' },
  { method: 'PATCH', path: '/:id/variants/:variantId/status', description: 'Toggle variant status' },
  
  // VariantType CRUD
  { method: 'POST', path: '/:id/variant-types', description: 'Create variant type' },
  { method: 'PUT', path: '/:id/variant-types/:typeId', description: 'Update variant type' },
  { method: 'DELETE', path: '/:id/variant-types/:typeId', description: 'Delete variant type' },
  
  // VariantValue CRUD
  { method: 'POST', path: '/:id/variant-types/:typeId/values', description: 'Create variant value' },
  { method: 'PUT', path: '/:id/variant-types/:typeId/values/:valueId', description: 'Update variant value' },
  { method: 'DELETE', path: '/:id/variant-types/:typeId/values/:valueId', description: 'Delete variant value' }
];

console.log('Verifying endpoints in products.js...\n');

let foundCount = 0;
let missingEndpoints = [];

expectedEndpoints.forEach(endpoint => {
  // Check if the endpoint exists in the file
  const endpointPattern = new RegExp(
    `router\\.${endpoint.method.toLowerCase()}\\(['"]${endpoint.path.replace(/:/g, '\\:')}['"]`
  );
  
  if (endpointPattern.test(productsContent)) {
    foundCount++;
    console.log(`✓ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(55)} - ${endpoint.description}`);
  } else {
    missingEndpoints.push(endpoint);
    console.log(`✗ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(55)} - MISSING`);
  }
});

console.log('\n----------------------------------------');
console.log(`Found: ${foundCount}/${expectedEndpoints.length} endpoints`);
console.log('----------------------------------------\n');

// Verify GET endpoints include variantTypes with values
console.log('Verifying GET endpoints include full variant data...\n');

const getEndpoints = [
  "router.get('/:id'",
  "router.get('/slug/:slug'"
];

let includesVariantTypes = 0;

getEndpoints.forEach(endpointPattern => {
  const startIndex = productsContent.indexOf(endpointPattern);
  if (startIndex !== -1) {
    // Find the include section after this endpoint
    const includeSection = productsContent.substring(startIndex, startIndex + 2000);
    
    if (includeSection.includes('variantTypes:') && 
        includeSection.includes('include:') && 
        includeSection.includes('values:')) {
      includesVariantTypes++;
      console.log(`✓ ${endpointPattern} includes variantTypes with values`);
    } else {
      console.log(`✗ ${endpointPattern} does NOT include full variant data`);
    }
  }
});

console.log('\n----------------------------------------');
console.log(`GET endpoints with full variant data: ${includesVariantTypes}/${getEndpoints.length}`);
console.log('----------------------------------------\n');

// Verify admin-only middleware on write operations
console.log('Verifying admin-only middleware on write operations...\n');

const writeEndpoints = expectedEndpoints.filter(e => 
  e.method === 'POST' || e.method === 'PUT' || e.method === 'DELETE' || e.method === 'PATCH'
);

let hasAdminMiddleware = 0;

writeEndpoints.forEach(endpoint => {
  const endpointPattern = new RegExp(
    `router\\.${endpoint.method.toLowerCase()}\\(['"]${endpoint.path.replace(/:/g, '\\:')}['"].*?authMiddleware\\.adminOnly\\(\\)`
  );
  
  if (endpointPattern.test(productsContent)) {
    hasAdminMiddleware++;
    console.log(`✓ ${endpoint.method.padEnd(6)} ${endpoint.path} has admin-only middleware`);
  } else {
    console.log(`✗ ${endpoint.method.padEnd(6)} ${endpoint.path} MISSING admin-only middleware`);
  }
});

console.log('\n----------------------------------------');
console.log(`Write operations with admin middleware: ${hasAdminMiddleware}/${writeEndpoints.length}`);
console.log('----------------------------------------\n');

// Verify validation
console.log('Verifying validation on endpoints...\n');

let hasValidation = 0;

expectedEndpoints.forEach(endpoint => {
  const endpointPattern = new RegExp(
    `router\\.${endpoint.method.toLowerCase()}\\(['"]${endpoint.path.replace(/:/g, '\\:')}['"]`
  );
  
  const match = endpointPattern.exec(productsContent);
  if (match) {
    // Check if there's validation before this endpoint
    const beforeEndpoint = productsContent.substring(Math.max(0, match.index - 500), match.index);
    if (beforeEndpoint.includes('body(') || beforeEndpoint.includes('param(')) {
      hasValidation++;
      console.log(`✓ ${endpoint.method.padEnd(6)} ${endpoint.path} has validation`);
    } else {
      console.log(`✗ ${endpoint.method.padEnd(6)} ${endpoint.path} MISSING validation`);
    }
  }
});

console.log('\n----------------------------------------');
console.log(`Endpoints with validation: ${hasValidation}/${expectedEndpoints.length}`);
console.log('----------------------------------------\n');

// Final summary
console.log('========================================');
console.log('FINAL VERIFICATION SUMMARY');
console.log('========================================\n');

const allChecksPassed = 
  foundCount === expectedEndpoints.length &&
  includesVariantTypes === getEndpoints.length &&
  hasAdminMiddleware === writeEndpoints.length &&
  hasValidation === expectedEndpoints.length;

if (allChecksPassed) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('Summary:');
  console.log(`  • All ${expectedEndpoints.length} variant management endpoints are present`);
  console.log(`  • GET endpoints include full variant data`);
  console.log(`  • All write operations have admin-only middleware`);
  console.log(`  • All endpoints have proper validation`);
  console.log('\n🎉 Variant management endpoints are complete and ready for use!\n');
} else {
  console.log('⚠️  SOME CHECKS FAILED\n');
  console.log('Issues found:');
  if (foundCount !== expectedEndpoints.length) {
    console.log(`  • Missing ${expectedEndpoints.length - foundCount} endpoints`);
  }
  if (includesVariantTypes !== getEndpoints.length) {
    console.log(`  • GET endpoints don't include full variant data`);
  }
  if (hasAdminMiddleware !== writeEndpoints.length) {
    console.log(`  • ${writeEndpoints.length - hasAdminMiddleware} write operations missing admin middleware`);
  }
  if (hasValidation !== expectedEndpoints.length) {
    console.log(`  • ${expectedEndpoints.length - hasValidation} endpoints missing validation`);
  }
  console.log('');
}

console.log('========================================\n');
