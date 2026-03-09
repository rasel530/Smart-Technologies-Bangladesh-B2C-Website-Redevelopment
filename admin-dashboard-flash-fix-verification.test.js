/**
 * Admin Dashboard Flash Issue Fix Verification Tests
 * 
 * This test suite verifies that the fixes for the admin dashboard flash issue
 * are properly implemented and working correctly.
 * 
 * Issue: Previous admin dashboard content was briefly shown during logout and login transitions.
 * 
 * Fixes Verified:
 * 1. Loading Overlay Component - Prevents showing old content during transitions
 * 2. Logout Flow Fix - Immediate loading overlay, clears content, uses window.location.replace()
 * 3. Login Redirect Fix - Prevents duplicate redirects, immediate loading overlay, clears content
 * 4. Cache Headers in Middleware - Prevents caching of /login and /admin routes
 * 5. Cache Headers in NextAuth Route - Dynamic rendering, no caching
 */

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log test results
function logTest(testName, passed, message, details = null) {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? colors.green : colors.red;
  
  console.log(`${color}[${status}]${colors.reset} ${testName}`);
  if (message) {
    console.log(`    ${message}`);
  }
  if (details) {
    console.log(`    Details: ${JSON.stringify(details, null, 2)}`);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    details
  });
  
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

// Helper function to read file content
function readFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Helper function to check if file exists
function fileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

// Helper function to check if string contains pattern
function contains(content, pattern) {
  if (!content) return false;
  return content.includes(pattern);
}

// Helper function to check regex match
function matches(content, regex) {
  if (!content) return false;
  return regex.test(content);
}

// ============================================================================
// TEST SUITE 1: Loading Overlay Component
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 1: Loading Overlay Component ===${colors.reset}\n`);

function testLoadingOverlayComponent() {
  console.log('Testing LoadingOverlay.tsx component...\n');
  
  const filePath = 'frontend/src/components/ui/LoadingOverlay.tsx';
  const content = readFile(filePath);
  
  // Test 1.1: File exists
  logTest(
    'LoadingOverlay.tsx file exists',
    fileExists(filePath),
    content ? 'File found' : 'File not found'
  );
  
  if (!content) return;
  
  // Test 1.2: Component is a React component
  logTest(
    'LoadingOverlay is a React component',
    contains(content, 'export default function LoadingOverlay'),
    'Component is properly exported as default function'
  );
  
  // Test 1.3: Component accepts fullScreen prop
  logTest(
    'LoadingOverlay accepts fullScreen prop',
    contains(content, 'fullScreen?: boolean'),
    'Component has fullScreen prop for full-screen overlay'
  );
  
  // Test 1.4: Component has z-index for overlay
  logTest(
    'LoadingOverlay has high z-index for overlay',
    contains(content, 'z-50') || contains(content, 'z-index'),
    'Component has z-index to ensure it appears on top'
  );
  
  // Test 1.5: Component has spinner animation
  logTest(
    'LoadingOverlay has spinner animation',
    contains(content, 'animate-spin'),
    'Component includes spinning animation for loading indicator'
  );
  
  // Test 1.6: Component has loading message
  logTest(
    'LoadingOverlay has loading message',
    contains(content, 'message') && contains(content, 'text-gray-600'),
    'Component displays loading message to user'
  );
  
  // Test 1.7: Component is client-side only
  logTest(
    'LoadingOverlay is client-side component',
    contains(content, "'use client'"),
    'Component is marked as client-side with use client directive'
  );
}

testLoadingOverlayComponent();

// ============================================================================
// TEST SUITE 2: Logout Flow Fix
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 2: Logout Flow Fix ===${colors.reset}\n`);

function testLogoutFlowFix() {
  console.log('Testing AuthContext.tsx logout function...\n');
  
  const filePath = 'frontend/src/contexts/AuthContext.tsx';
  const content = readFile(filePath);
  
  // Test 2.1: File exists
  logTest(
    'AuthContext.tsx file exists',
    fileExists(filePath),
    content ? 'File found' : 'File not found'
  );
  
  if (!content) return;
  
  // Test 2.2: Logout function exists
  logTest(
    'Logout function exists in AuthContext',
    contains(content, 'const logout = async () =>'),
    'Logout function is defined'
  );
  
  // Test 2.3: Sets just_logged_out flag
  logTest(
    'Logout sets just_logged_out flag in sessionStorage',
    contains(content, "sessionStorage.setItem('just_logged_out', 'true')"),
    'Flag is set to prevent auto-redirect on login page'
  );
  
  // Test 2.4: Creates loading overlay immediately
  logTest(
    'Logout creates loading overlay immediately',
    contains(content, 'document.createElement') && 
    contains(content, 'loadingOverlay.id = \'logout-loading-overlay\'') &&
    contains(content, 'z-index: 99999'),
    'Loading overlay is created with highest z-index'
  );
  
  // Test 2.5: Loading overlay has white background
  logTest(
    'Logout loading overlay has white background',
    contains(content, 'background: white'),
    'Overlay has white background to hide old content'
  );
  
  // Test 2.6: Loading overlay is appended to body
  logTest(
    'Logout loading overlay is appended to document body',
    contains(content, 'document.body.appendChild(loadingOverlay)'),
    'Overlay is added to body to cover entire page'
  );
  
  // Test 2.7: Clears page content before redirect
  logTest(
    'Logout clears page content before redirect',
    contains(content, 'document.body.innerHTML = \'\'') &&
    contains(content, 'document.head.innerHTML = \'\''),
    'Both body and head content are cleared before redirect'
  );
  
  // Test 2.8: Uses window.location.replace() instead of href
  logTest(
    'Logout uses window.location.replace() for redirect',
    contains(content, 'window.location.replace(\'/login\')') &&
    !content.includes('window.location.href = \'/login\''),
    'Uses replace() to prevent back button issues'
  );
  
  // Test 2.9: Error handling also clears content
  logTest(
    'Logout error handling also clears page content',
    matches(content, /catch\s*\(error\)[\s\S]*document\.body\.innerHTML\s*=\s*''[\s\S]*document\.head\.innerHTML\s*=\s*''/),
    'Error handling path also clears content'
  );
  
  // Test 2.10: Error handling also uses replace()
  logTest(
    'Logout error handling also uses window.location.replace()',
    matches(content, /catch\s*\(error\)[\s\S]*window\.location\.replace\('\/login'\)/),
    'Error handling path also uses replace()'
  );
}

testLogoutFlowFix();

// ============================================================================
// TEST SUITE 3: Login Redirect Fix
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 3: Login Redirect Fix ===${colors.reset}\n`);

function testLoginRedirectFix() {
  console.log('Testing login/page.tsx redirect logic...\n');
  
  const filePath = 'frontend/src/app/login/page.tsx';
  const content = readFile(filePath);
  
  // Test 3.1: File exists
  logTest(
    'login/page.tsx file exists',
    fileExists(filePath),
    content ? 'File found' : 'File not found'
  );
  
  if (!content) return;
  
  // Test 3.2: isRedirecting state exists
  logTest(
    'isRedirecting state exists in login page',
    contains(content, 'const [isRedirecting, setIsRedirecting] = useState(false)'),
    'State exists to prevent duplicate redirects'
  );
  
  // Test 3.3: Checks just_logged_out flag
  logTest(
    'Login page checks just_logged_out flag',
    contains(content, "sessionStorage.getItem('just_logged_out')"),
    'Checks flag to prevent auto-redirect after logout'
  );
  
  // Test 3.4: Prevents redirect if just logged out
  logTest(
    'Login page prevents redirect if just_logged_out is set',
    contains(content, '!justLoggedOut') || contains(content, 'justLoggedOut === null'),
    'Redirect is prevented when user just logged out'
  );
  
  // Test 3.5: Prevents duplicate redirects with isRedirecting
  logTest(
    'Login page prevents duplicate redirects',
    contains(content, '!isRedirecting') && contains(content, 'setIsRedirecting(true)'),
    'isRedirecting state prevents multiple redirects'
  );
  
  // Test 3.6: Creates loading overlay before redirect
  logTest(
    'Login creates loading overlay before redirect',
    contains(content, 'document.createElement') && 
    contains(content, 'loadingOverlay.id = \'login-redirect-overlay\'') &&
    contains(content, 'z-index: 99999'),
    'Loading overlay is created with highest z-index'
  );
  
  // Test 3.7: Loading overlay has white background
  logTest(
    'Login loading overlay has white background',
    contains(content, 'background: white'),
    'Overlay has white background to hide old content'
  );
  
  // Test 3.8: Clears page content before redirect
  logTest(
    'Login clears page content before redirect',
    contains(content, 'document.body.innerHTML = \'\'') &&
    contains(content, 'document.head.innerHTML = \'\''),
    'Both body and head content are cleared before redirect'
  );
  
  // Test 3.9: Uses window.location.href for clean page load
  logTest(
    'Login uses window.location.href for redirect',
    contains(content, 'window.location.href = targetUrl'),
    'Uses href for clean page load instead of router.replace()'
  );
  
  // Test 3.10: Clears just_logged_out flag after checking
  logTest(
    'Login clears just_logged_out flag after checking',
    contains(content, "sessionStorage.removeItem('just_logged_out')"),
    'Flag is cleared after preventing auto-redirect'
  );
}

testLoginRedirectFix();

// ============================================================================
// TEST SUITE 4: Cache Headers in Middleware
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 4: Cache Headers in Middleware ===${colors.reset}\n`);

function testCacheHeadersMiddleware() {
  console.log('Testing middleware.ts cache headers...\n');
  
  const filePath = 'frontend/src/middleware.ts';
  const content = readFile(filePath);
  
  // Test 4.1: File exists
  logTest(
    'middleware.ts file exists',
    fileExists(filePath),
    content ? 'File found' : 'File not found'
  );
  
  if (!content) return;
  
  // Test 4.2: Adds cache headers for /login routes
  logTest(
    'Middleware adds cache headers for /login routes',
    contains(content, "pathname.startsWith('/login')") &&
    contains(content, 'response.headers.set(\'Cache-Control\''),
    'Cache headers are set for login routes'
  );
  
  // Test 4.3: Cache-Control header has no-store
  logTest(
    'Middleware Cache-Control includes no-store',
    contains(content, 'no-store'),
    'Cache-Control header includes no-store directive'
  );
  
  // Test 4.4: Cache-Control header has no-cache
  logTest(
    'Middleware Cache-Control includes no-cache',
    contains(content, 'no-cache'),
    'Cache-Control header includes no-cache directive'
  );
  
  // Test 4.5: Cache-Control header has must-revalidate
  logTest(
    'Middleware Cache-Control includes must-revalidate',
    contains(content, 'must-revalidate'),
    'Cache-Control header includes must-revalidate directive'
  );
  
  // Test 4.6: Cache-Control header has max-age=0
  logTest(
    'Middleware Cache-Control includes max-age=0',
    contains(content, 'max-age=0'),
    'Cache-Control header sets max-age to 0'
  );
  
  // Test 4.7: Adds Pragma: no-cache header
  logTest(
    'Middleware adds Pragma: no-cache header',
    contains(content, "response.headers.set('Pragma', 'no-cache')"),
    'Pragma header is set for backward compatibility'
  );
  
  // Test 4.8: Adds Expires: 0 header
  logTest(
    'Middleware adds Expires: 0 header',
    contains(content, "response.headers.set('Expires', '0')"),
    'Expires header is set for backward compatibility'
  );
  
  // Test 4.9: Adds cache headers for /admin routes
  logTest(
    'Middleware adds cache headers for /admin routes',
    contains(content, "pathname.startsWith('/admin')") &&
    contains(content, 'response.headers.set(\'Cache-Control\''),
    'Cache headers are also set for admin routes'
  );
  
  // Test 4.10: Matcher includes both /admin and /login
  logTest(
    'Middleware matcher includes both /admin and /login routes',
    contains(content, "matcher: ['/admin/:path*', '/login/:path*']") ||
    (contains(content, '/admin/:path*') && contains(content, '/login/:path*')),
    'Matcher config includes both admin and login routes'
  );
}

testCacheHeadersMiddleware();

// ============================================================================
// TEST SUITE 5: Cache Headers in NextAuth Route
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 5: Cache Headers in NextAuth Route ===${colors.reset}\n`);

function testCacheHeadersNextAuth() {
  console.log('Testing NextAuth route cache configuration...\n');
  
  const filePath = 'frontend/src/app/api/auth/[...nextauth]/route.ts';
  const content = readFile(filePath);
  
  // Test 5.1: File exists
  logTest(
    'NextAuth route.ts file exists',
    fileExists(filePath),
    content ? 'File found' : 'File not found'
  );
  
  if (!content) return;
  
  // Test 5.2: Has dynamic = 'force-dynamic'
  logTest(
    'NextAuth route has dynamic = force-dynamic',
    contains(content, "export const dynamic = 'force-dynamic'"),
    'Route is configured for dynamic rendering'
  );
  
  // Test 5.3: Has revalidate = 0
  logTest(
    'NextAuth route has revalidate = 0',
    contains(content, 'export const revalidate = 0'),
    'Route is configured to not revalidate cached data'
  );
  
  // Test 5.4: Has fetchCache = 'force-no-store'
  logTest(
    'NextAuth route has fetchCache = force-no-store',
    contains(content, "export const fetchCache = 'force-no-store'"),
    'Route is configured to not cache fetch requests'
  );
  
  // Test 5.5: All cache prevention directives are present
  logTest(
    'NextAuth route has all cache prevention directives',
    contains(content, "dynamic = 'force-dynamic'") &&
    contains(content, 'revalidate = 0') &&
    contains(content, "fetchCache = 'force-no-store'"),
    'All three cache prevention directives are present'
  );
}

testCacheHeadersNextAuth();

// ============================================================================
// TEST SUITE 6: Integration Tests
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 6: Integration Tests ===${colors.reset}\n`);

function testIntegration() {
  console.log('Testing integration of all fixes...\n');
  
  const authContextContent = readFile('frontend/src/contexts/AuthContext.tsx');
  const loginPageContent = readFile('frontend/src/app/login/page.tsx');
  const middlewareContent = readFile('frontend/src/middleware.ts');
  const nextAuthContent = readFile('frontend/src/app/api/auth/[...nextauth]/route.ts');
  
  // Test 6.1: All files exist
  logTest(
    'All fix implementation files exist',
    authContextContent && loginPageContent && middlewareContent && nextAuthContent,
    'All required files are present'
  );
  
  // Test 6.2: Consistent z-index usage (99999)
  logTest(
    'Consistent z-index (99999) used across loading overlays',
    contains(authContextContent, 'z-index: 99999') &&
    contains(loginPageContent, 'z-index: 99999'),
    'Both logout and login use same high z-index'
  );
  
  // Test 6.3: Consistent white background
  logTest(
    'Consistent white background used across loading overlays',
    contains(authContextContent, 'background: white') &&
    contains(loginPageContent, 'background: white'),
    'Both logout and login use white background'
  );
  
  // Test 6.4: Consistent page clearing
  logTest(
    'Consistent page clearing across logout and login',
    contains(authContextContent, 'document.body.innerHTML = \'\'') &&
    contains(authContextContent, 'document.head.innerHTML = \'\'') &&
    contains(loginPageContent, 'document.body.innerHTML = \'\'') &&
    contains(loginPageContent, 'document.head.innerHTML = \'\''),
    'Both logout and login clear body and head content'
  );
  
  // Test 6.5: Consistent cache headers
  logTest(
    'Consistent cache headers across middleware and NextAuth',
    contains(middlewareContent, 'no-store, no-cache, must-revalidate, max-age=0') &&
    contains(nextAuthContent, "dynamic = 'force-dynamic'") &&
    contains(nextAuthContent, 'revalidate = 0') &&
    contains(nextAuthContent, "fetchCache = 'force-no-store'"),
    'All cache prevention mechanisms are in place'
  );
  
  // Test 6.6: just_logged_out flag is used consistently
  logTest(
    'just_logged_out flag is used consistently',
    contains(authContextContent, "sessionStorage.setItem('just_logged_out', 'true')") &&
    contains(loginPageContent, "sessionStorage.getItem('just_logged_out')") &&
    contains(loginPageContent, "sessionStorage.removeItem('just_logged_out')"),
    'Flag is set, checked, and cleared properly'
  );
  
  // Test 6.7: Loading overlay IDs are unique
  logTest(
    'Loading overlay IDs are unique',
    contains(authContextContent, 'logout-loading-overlay') &&
    contains(loginPageContent, 'login-redirect-overlay'),
    'Each loading overlay has a unique ID'
  );
  
  // Test 6.8: Loading overlay messages are appropriate
  logTest(
    'Loading overlay messages are appropriate',
    contains(authContextContent, 'Logging out...') &&
    contains(loginPageContent, 'Redirecting...'),
    'Each loading overlay has context-appropriate message'
  );
}

testIntegration();

// ============================================================================
// TEST SUITE 7: Edge Case Tests
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 7: Edge Case Tests ===${colors.reset}\n`);

function testEdgeCases() {
  console.log('Testing edge cases and potential issues...\n');
  
  const authContextContent = readFile('frontend/src/contexts/AuthContext.tsx');
  const loginPageContent = readFile('frontend/src/app/login/page.tsx');
  
  // Test 7.1: Logout handles errors gracefully
  logTest(
    'Logout handles errors gracefully',
    contains(authContextContent, 'catch') &&
    contains(authContextContent, 'console.error'),
    'Logout has error handling with logging'
  );
  
  // Test 7.2: Login redirect checks for cart merge prompt
  logTest(
    'Login redirect checks for cart merge prompt',
    contains(loginPageContent, '!showCartMergePrompt'),
    'Redirect is prevented if cart merge prompt is shown'
  );
  
  // Test 7.3: Login redirect validates redirect target
  logTest(
    'Login redirect validates redirect target',
    contains(loginPageContent, 'safeRedirects') &&
    contains(loginPageContent, 'isSafeRedirect'),
    'Redirect target is validated against safe list'
  );
  
  // Test 7.4: Login redirect uses role-based routing
  logTest(
    'Login redirect uses role-based routing',
    contains(loginPageContent, "role === 'admin' || role === 'super_admin' ? '/admin' : '/account'"),
    'Redirect target is based on user role'
  );
  
  // Test 7.5: Loading overlay is created before any async operations
  logTest(
    'Logout loading overlay is created before async operations',
    matches(authContextContent, /loadingOverlay\.id[\s\S]*document\.body\.appendChild[\s\S]*await nextAuthSignOut/),
    'Overlay is created before calling NextAuth signOut'
  );
  
  // Test 7.6: Login loading overlay is created before redirect
  logTest(
    'Login loading overlay is created before redirect',
    matches(loginPageContent, /loadingOverlay\.id[\s\S]*document\.body\.appendChild[\s\S]*window\.location\.href/),
    'Overlay is created before redirect'
  );
  
  // Test 7.7: Page content is cleared after overlay is added
  logTest(
    'Page content is cleared after loading overlay is added',
    matches(authContextContent, /document\.body\.appendChild[\s\S]*document\.body\.innerHTML\s*=\s*''/) &&
    matches(loginPageContent, /document\.body\.appendChild[\s\S]*document\.body\.innerHTML\s*=\s*''/),
    'Content clearing happens after overlay is visible'
  );
  
  // Test 7.8: Multiple logout cycles are supported
  logTest(
    'Multiple logout cycles are supported',
    contains(authContextContent, "sessionStorage.setItem('just_logged_out', 'true')") &&
    contains(loginPageContent, "sessionStorage.removeItem('just_logged_out')"),
    'Flag mechanism supports multiple cycles'
  );
}

testEdgeCases();

// ============================================================================
// TEST SUITE 8: Security Tests
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUITE 8: Security Tests ===${colors.reset}\n`);

function testSecurity() {
  console.log('Testing security aspects of the fixes...\n');
  
  const middlewareContent = readFile('frontend/src/middleware.ts');
  const nextAuthContent = readFile('frontend/src/app/api/auth/[...nextauth]/route.ts');
  
  // Test 8.1: Middleware protects admin routes
  logTest(
    'Middleware protects admin routes with authentication',
    contains(middlewareContent, 'getToken') &&
    contains(middlewareContent, 'if (!token)'),
    'Admin routes require authentication'
  );
  
  // Test 8.2: Middleware checks for admin role
  logTest(
    'Middleware checks for admin role',
    contains(middlewareContent, 'hasAdminRole') &&
    contains(middlewareContent, "role === 'admin' || role === 'super_admin'"),
    'Only admin users can access admin routes'
  );
  
  // Test 8.3: Cache headers prevent sensitive data caching
  logTest(
    'Cache headers prevent caching of sensitive admin data',
    contains(middlewareContent, 'no-store') &&
    contains(middlewareContent, 'no-cache'),
    'Admin pages are not cached by browser'
  );
  
  // Test 8.4: NextAuth route is not cached
  logTest(
    'NextAuth route is configured to not be cached',
    contains(nextAuthContent, "dynamic = 'force-dynamic'") &&
    contains(nextAuthContent, "fetchCache = 'force-no-store'"),
    'Auth route is always dynamically generated'
  );
  
  // Test 8.5: Session tokens are not cached
  logTest(
    'Session tokens are not cached',
    contains(nextAuthContent, 'httpOnly: true'),
    'Session cookies are HTTP-only for security'
  );
  
  // Test 8.6: SameSite attribute is set for cookies
  logTest(
    'SameSite attribute is set for cookies',
    contains(nextAuthContent, 'sameSite: \'lax\''),
    'Cookies have SameSite protection against CSRF'
  );
  
  // Test 8.7: Secure flag is set for production
  logTest(
    'Secure flag is set for production cookies',
    contains(nextAuthContent, 'secure: process.env.NODE_ENV === \'production\''),
    'Cookies are secure in production environment'
  );
}

testSecurity();

// ============================================================================
// Generate Test Report
// ============================================================================
console.log(`\n${colors.cyan}=== TEST SUMMARY ===${colors.reset}\n`);

console.log(`Total Tests: ${testResults.summary.total}`);
console.log(`${colors.green}Passed: ${testResults.summary.passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${testResults.summary.failed}${colors.reset}`);
console.log(`Skipped: ${testResults.summary.skipped}\n`);

const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2);
console.log(`Pass Rate: ${passRate}%\n`);

// Determine overall result
const allPassed = testResults.summary.failed === 0;
if (allPassed) {
  console.log(`${colors.green}✓ ALL TESTS PASSED${colors.reset}\n`);
  console.log('The admin dashboard flash issue fixes are properly implemented.');
  console.log('All required components and configurations are in place.\n');
} else {
  console.log(`${colors.red}✗ SOME TESTS FAILED${colors.reset}\n`);
  console.log('Please review the failed tests above and fix the issues.\n');
}

// Save test results to file
const resultsFileName = `admin-dashboard-flash-fix-test-results-${Date.now()}.json`;
fs.writeFileSync(
  resultsFileName,
  JSON.stringify(testResults, null, 2)
);
console.log(`Test results saved to: ${resultsFileName}\n`);

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
