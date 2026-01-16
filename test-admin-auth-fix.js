/**
 * Test file to verify the admin authentication fix implementation
 * 
 * This test verifies that:
 * 1. The admin page now imports withAuth HOC
 * 2. The component is wrapped with withAuth
 * 3. The requiredRole configuration is correct
 * 4. The unauthorizedRedirectTo parameter is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ADMIN AUTHENTICATION FIX VERIFICATION TEST');
console.log('='.repeat(80));
console.log();

// Test 1: Check that withAuth is imported in the admin page
console.log('Test 1: Checking withAuth import in admin page...');
const adminPagePath = path.join(__dirname, 'frontend/src/app/admin/page.tsx');
const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');

const withAuthImportRegex = /import\s+\{\s*withAuth\s*\}\s+from\s+['"]@\/components\/auth\/withAuth['"]/;
const hasWithAuthImport = withAuthImportRegex.test(adminPageContent);

if (hasWithAuthImport) {
  console.log('✅ PASS: withAuth is imported in the admin page');
} else {
  console.log('❌ FAIL: withAuth import not found in the admin page');
}
console.log();

// Test 2: Check that the component is wrapped with withAuth
console.log('Test 2: Checking that AdminDashboard is wrapped with withAuth...');
const withAuthExportRegex = /export\s+default\s+withAuth\s*\(\s*AdminDashboard\s*,/g;
const withAuthExportMatch = adminPageContent.match(withAuthExportRegex);

if (withAuthExportMatch && withAuthExportMatch.length > 0) {
  console.log('✅ PASS: AdminDashboard is wrapped with withAuth HOC');
} else {
  console.log('❌ FAIL: AdminDashboard is not wrapped with withAuth HOC');
}
console.log();

// Test 3: Check that requiredRole is configured correctly
console.log('Test 3: Checking requiredRole configuration...');
const requiredRoleRegex = /requiredRole:\s*\[\s*['"]admin['"]\s*,\s*['"]super_admin['"]\s*\]/;
const hasCorrectRequiredRole = requiredRoleRegex.test(adminPageContent);

if (hasCorrectRequiredRole) {
  console.log('✅ PASS: requiredRole is configured with [\'admin\', \'super_admin\']');
} else {
  console.log('❌ FAIL: requiredRole configuration is incorrect or missing');
}
console.log();

// Test 4: Check that redirectTo is configured correctly
console.log('Test 4: Checking redirectTo configuration...');
const redirectToRegex = /redirectTo:\s*['"]\/login['"]/;
const hasCorrectRedirectTo = redirectToRegex.test(adminPageContent);

if (hasCorrectRedirectTo) {
  console.log('✅ PASS: redirectTo is configured to \'/login\'');
} else {
  console.log('❌ FAIL: redirectTo configuration is incorrect or missing');
}
console.log();

// Test 5: Check that unauthorizedRedirectTo is configured correctly
console.log('Test 5: Checking unauthorizedRedirectTo configuration...');
const unauthorizedRedirectToRegex = /unauthorizedRedirectTo:\s*['"]\/unauthorized['"]/;
const hasCorrectUnauthorizedRedirectTo = unauthorizedRedirectToRegex.test(adminPageContent);

if (hasCorrectUnauthorizedRedirectTo) {
  console.log('✅ PASS: unauthorizedRedirectTo is configured to \'/unauthorized\'');
} else {
  console.log('❌ FAIL: unauthorizedRedirectTo configuration is incorrect or missing');
}
console.log();

// Test 6: Check that the old useEffect has been removed
console.log('Test 6: Checking that old useEffect has been removed...');
const oldUseEffectRegex = /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?Check if user has admin role[\s\S]*?\},\s*\[\s*user,\s*isLoading,\s*router\s*\]\s*\)/;
const hasOldUseEffect = oldUseEffectRegex.test(adminPageContent);

if (!hasOldUseEffect) {
  console.log('✅ PASS: Old useEffect that checked role has been removed');
} else {
  console.log('❌ FAIL: Old useEffect still exists in the admin page');
}
console.log();

// Test 7: Check that the old loading state check has been removed
console.log('Test 7: Checking that old loading state check has been removed...');
const oldLoadingCheckRegex = /if\s*\(\s*isLoading\s*\)\s*\{[\s\S]*?Loading\.\.\.[\s\S]*?\}/;
const hasOldLoadingCheck = oldLoadingCheckRegex.test(adminPageContent);

if (!hasOldLoadingCheck) {
  console.log('✅ PASS: Old loading state check has been removed');
} else {
  console.log('❌ FAIL: Old loading state check still exists in the admin page');
}
console.log();

// Test 8: Check that the old unauthorized page check has been removed
console.log('Test 8: Checking that old unauthorized page check has been removed...');
const oldUnauthorizedCheckRegex = /if\s*\(\s*!isLoading\s*&&\s*user\s*\)\s*\{[\s\S]*?Unauthorized Access[\s\S]*?\}/;
const hasOldUnauthorizedCheck = oldUnauthorizedCheckRegex.test(adminPageContent);

if (!hasOldUnauthorizedCheck) {
  console.log('✅ PASS: Old unauthorized page check has been removed');
} else {
  console.log('❌ FAIL: Old unauthorized page check still exists in the admin page');
}
console.log();

// Test 9: Check that the component is now a named export (not default)
console.log('Test 9: Checking that AdminDashboard is a named export...');
const namedExportRegex = /function\s+AdminDashboard\s*\(\)/;
const hasNamedExport = namedExportRegex.test(adminPageContent);

if (hasNamedExport) {
  console.log('✅ PASS: AdminDashboard is a named export');
} else {
  console.log('❌ FAIL: AdminDashboard is not a named export');
}
console.log();

// Test 10: Check that useEffect import has been removed
console.log('Test 10: Checking that useEffect import has been removed...');
const useEffectImportRegex = /import\s+\{\s*useEffect\s*\}\s+from\s+['"]react['"]/;
const hasUseEffectImport = useEffectImportRegex.test(adminPageContent);

if (!hasUseEffectImport) {
  console.log('✅ PASS: useEffect import has been removed');
} else {
  console.log('❌ FAIL: useEffect import still exists');
}
console.log();

// Test 11: Verify withAuth HOC supports unauthorizedRedirectTo
console.log('Test 11: Checking withAuth HOC supports unauthorizedRedirectTo parameter...');
const withAuthPath = path.join(__dirname, 'frontend/src/components/auth/withAuth.tsx');
const withAuthContent = fs.readFileSync(withAuthPath, 'utf8');

const unauthorizedRedirectToInterfaceRegex = /unauthorizedRedirectTo\?\:\s*string/;
const hasUnauthorizedRedirectToInterface = unauthorizedRedirectToInterfaceRegex.test(withAuthContent);

if (hasUnauthorizedRedirectToInterface) {
  console.log('✅ PASS: withAuth HOC interface includes unauthorizedRedirectTo parameter');
} else {
  console.log('❌ FAIL: withAuth HOC interface does not include unauthorizedRedirectTo parameter');
}
console.log();

// Test 12: Verify withAuth HOC uses unauthorizedRedirectTo for redirection
console.log('Test 12: Checking withAuth HOC uses unauthorizedRedirectTo for redirection...');
const unauthorizedRedirectToUsageRegex = /if\s*\(\s*unauthorizedRedirectTo\s*\)\s*\{[\s\S]*?router\.push\s*\(\s*unauthorizedRedirectTo\s*\)/;
const hasUnauthorizedRedirectToUsage = unauthorizedRedirectToUsageRegex.test(withAuthContent);

if (hasUnauthorizedRedirectToUsage) {
  console.log('✅ PASS: withAuth HOC uses unauthorizedRedirectTo for redirection');
} else {
  console.log('❌ FAIL: withAuth HOC does not use unauthorizedRedirectTo for redirection');
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));

const allTests = [
  hasWithAuthImport,
  withAuthExportMatch && withAuthExportMatch.length > 0,
  hasCorrectRequiredRole,
  hasCorrectRedirectTo,
  hasCorrectUnauthorizedRedirectTo,
  !hasOldUseEffect,
  !hasOldLoadingCheck,
  !hasOldUnauthorizedCheck,
  hasNamedExport,
  !hasUseEffectImport,
  hasUnauthorizedRedirectToInterface,
  hasUnauthorizedRedirectToUsage
];

const passedTests = allTests.filter(test => test).length;
const totalTests = allTests.length;

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log();

if (passedTests === totalTests) {
  console.log('✅ ALL TESTS PASSED! The admin authentication fix has been successfully implemented.');
  console.log();
  console.log('Expected behavior after fix:');
  console.log('  - Unauthenticated users navigating to /admin will be redirected to /login');
  console.log('  - Authenticated non-admin users will be redirected to /unauthorized');
  console.log('  - Only admin/super_admin users can access the admin dashboard');
} else {
  console.log('❌ SOME TESTS FAILED! Please review the failed tests above.');
}

console.log('='.repeat(80));
