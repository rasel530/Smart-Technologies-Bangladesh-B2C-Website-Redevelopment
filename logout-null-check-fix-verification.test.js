/**
 * Logout Null Check Fix Verification Test
 *
 * This test verifies that the null checks added to removeChild calls
 * prevent the TypeError that occurs during logout when document.body becomes null.
 */

const fs = require('fs');
const path = require('path');

console.log('=== Logout Null Check Fix Verification ===\n');

// Track test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Check if a file has safe removeChild calls with null checks
 * @param {string} filePath - Path to the file to check
 * @returns {object} - Test result for the file
 */
function checkFileForSafeRemoveChild(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Find all removeChild calls
  const removeChildPattern = /document\.body\.removeChild\((\w+)\)/g;
  const matches = [...content.matchAll(removeChildPattern)];

  // Find all safe removeChild calls with null checks
  const safePattern = /if\s*\(\s*document\.body\s*&&\s*\w+\.parentNode\s*===\s*document\.body\s*\)\s*\{[^}]*document\.body\.removeChild\([^)]+\)[^}]*\}/g;
  const safeMatches = [...content.matchAll(safePattern)];

  const result = {
    fileName,
    filePath,
    totalRemoveChildCalls: matches.length,
    safeRemoveChildCalls: safeMatches.length,
    hasUnsafeCalls: matches.length > safeMatches.length,
    passed: matches.length === safeMatches.length
  };

  return result;
}

/**
 * Test a single file
 * @param {string} filePath - Path to the file to test
 */
function testFile(filePath) {
  results.total++;

  if (!fs.existsSync(filePath)) {
    results.failed++;
    results.details.push({
      file: path.basename(filePath),
      status: 'SKIPPED',
      reason: 'File not found'
    });
    return;
  }

  const result = checkFileForSafeRemoveChild(filePath);

  if (result.passed) {
    results.passed++;
    results.details.push({
      file: result.fileName,
      status: 'PASSED',
      removeChildCalls: result.totalRemoveChildCalls,
      safeCalls: result.safeRemoveChildCalls
    });
  } else {
    results.failed++;
    results.details.push({
      file: result.fileName,
      status: 'FAILED',
      removeChildCalls: result.totalRemoveChildCalls,
      safeCalls: result.safeRemoveChildCalls,
      unsafeCalls: result.totalRemoveChildCalls - result.safeRemoveChildCalls
    });
  }
}

// Files to test
const filesToTest = [
  'frontend/src/contexts/WishlistContext.tsx',
  'frontend/src/components/comparisons/ExportComparison.tsx',
  'frontend/src/components/account/DataExportSection.tsx',
  'frontend/src/app/admin/invoices/page.tsx',
  'frontend/src/app/admin/orders/page.tsx',
  'frontend/src/app/admin/payments/page.tsx',
  'frontend/src/app/admin/notifications/page.tsx',
  'frontend/src/components/admin/cart/CartDetail.tsx',
  'frontend/src/components/admin/cart/CartList.tsx',
  'frontend/src/components/admin/checkout/CheckoutSessionTable.tsx',
  'frontend/src/components/admin/checkout/GuestCheckoutTable.tsx',
  'frontend/src/app/orders/[id]/page.tsx',
  'frontend/src/app/search/analytics/page.tsx',
  'frontend/src/app/account/corporate/invoices/page.tsx',
  'frontend/src/app/admin/comparisons/page.tsx',
  'frontend/src/app/admin/comparisons/analytics/page.tsx',
  'frontend/src/app/admin/wishlists/analytics/page.tsx',
  'frontend/src/app/admin/wishlists/users/page.tsx',
  'frontend/src/app/admin/search/analytics/page.tsx',
  'frontend/src/app/admin/search/users/[id]/page.tsx',
  'frontend/src/app/admin/orders/sharing/page.tsx',
  'frontend/src/app/admin/payments/analytics/page.tsx',
  'frontend/src/app/admin/notifications/stats/page.tsx',
  'frontend/src/app/admin/elasticsearch/synonyms/page.tsx',
  'frontend/src/components/admin/cart/InventoryImpact.tsx',
  'frontend/src/components/admin/cartWishlist/CartWishlistAnalytics.tsx',
  'frontend/src/components/admin/cartWishlist/CartWishlistSyncDashboard.tsx',
  'frontend/src/components/admin/cartWishlist/SyncConflictResolver.tsx',
  'frontend/src/components/admin/cartWishlist/UserBehaviorTracker.tsx',
  'frontend/src/components/admin/checkout/CheckoutAbandonmentTable.tsx',
  'frontend/src/hooks/useOrderConfirmation.ts',
  'frontend/src/lib/utils.ts',
  'frontend/src/store/adminCartWishlistStore.ts'
];

// Run tests
console.log('Testing files for safe removeChild calls...\n');
filesToTest.forEach(testFile);

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Total files tested: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`);

// Print detailed results
console.log('=== Detailed Results ===');
results.details.forEach(detail => {
  if (detail.status === 'PASSED') {
    console.log(`✓ ${detail.file}: ${detail.removeChildCalls} removeChild call(s) - All safe`);
  } else if (detail.status === 'FAILED') {
    console.log(`✗ ${detail.file}: ${detail.removeChildCalls} total, ${detail.safeCalls} safe, ${detail.unsafeCalls} unsafe`);
  } else {
    console.log(`○ ${detail.file}: ${detail.reason}`);
  }
});

// Final verdict
console.log('\n=== Verdict ===');
if (results.failed === 0) {
  console.log('✓ All tests PASSED!');
  console.log('\nThe null check fix has been successfully applied to all removeChild calls.');
  console.log('This will prevent the TypeError that occurs during logout when document.body becomes null.');
  process.exit(0);
} else {
  console.log(`✗ ${results.failed} test(s) FAILED!`);
  console.log('\nSome files still have unsafe removeChild calls that need to be fixed.');
  process.exit(1);
}
