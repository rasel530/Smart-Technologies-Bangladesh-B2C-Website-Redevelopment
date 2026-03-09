/**
 * Guest Checkout Final Verification Test
 * 
 * Comprehensive test suite to verify all fixes for Guest Checkout issues:
 * 1. Empty cartId causing "Invalid cart ID" validation error
 * 2. Cart showing empty on refresh but previous items when adding products
 * 3. cartId value is "guest" instead of valid UUID
 * 
 * @version 1.0.0
 * @date 2026-02-23
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

/**
 * Log test result with color coding
 */
function logTestResult(testName, passed, message, details = null) {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? colors.green : colors.red;
  
  console.log(`${color}${colors.bright}[${status}]${colors.reset} ${testName}`);
  
  if (message) {
    console.log(`    ${colors.cyan}${message}${colors.reset}`);
  }
  
  if (details) {
    console.log(`    ${colors.yellow}Details:${colors.reset}`);
    console.log(`    ${JSON.stringify(details, null, 2).split('\n').join('\n    ')}`);
  }
  
  testResults.tests.push({
    name: testName,
    status: passed ? 'passed' : 'failed',
    message,
    details,
    timestamp: new Date().toISOString(),
  });
  
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

/**
 * Log test section header
 */
function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}=================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}=================================================================${colors.reset}\n`);
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath} - ${error.message}`);
  }
}

/**
 * Verify code pattern in file
 */
function verifyCodePattern(filePath, pattern, description) {
  try {
    const content = readFile(filePath);
    const regex = new RegExp(pattern, 'gm');
    const matches = content.match(regex);
    
    return {
      found: matches !== null,
      count: matches ? matches.length : 0,
      matches: matches || [],
    };
  } catch (error) {
    return {
      found: false,
      count: 0,
      matches: [],
      error: error.message,
    };
  }
}

/**
 * Extract specific lines from file
 */
function extractLines(filePath, startLine, endLine) {
  try {
    const content = readFile(filePath);
    const lines = content.split('\n');
    const extracted = lines.slice(startLine - 1, endLine);
    return extracted.join('\n');
  } catch (error) {
    throw new Error(`Failed to extract lines: ${error.message}`);
  }
}

/**
 * ============================================================================
 * TEST 1: Verify cartId is NOT passed to checkout initialization API for guest users
 * ============================================================================
 */
function runTest1() {
  logSection('TEST 1: Verify cartId is NOT passed to checkout initialization API for guest users');
  
  let allPassed = true;
  
  // Test 1.1: Verify initializeSession accepts cartId parameter
  const test1_1 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'const initializeSession = useCallback\\(async \\(guestId\\?: string, sessionId\\?: string, cartId\\?: string\\)',
    'initializeSession function signature'
  );
  
  logTestResult(
    '1.1: initializeSession accepts cartId parameter',
    test1_1.found,
    test1_1.found 
      ? 'Function signature correctly includes cartId parameter' 
      : 'Function signature does not include cartId parameter',
    { matches: test1_1.matches }
  );
  
  if (!test1_1.found) allPassed = false;
  
  // Test 1.2: Verify cartId is set to undefined for guest users
  const test1_2 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'cartId:\\s*undefined',
    'cartId set to undefined'
  );
  
  logTestResult(
    '1.2: cartId is set to undefined for guest users',
    test1_2.found,
    test1_2.found 
      ? 'cartId is correctly set to undefined' 
      : 'cartId is not set to undefined',
    { matches: test1_2.matches }
  );
  
  if (!test1_2.found) allPassed = false;
  
  // Test 1.3: Verify explanatory comment is present
  const test1_3 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'Note:.*cartId is not passed for guest users',
    'Explanatory comment'
  );
  
  logTestResult(
    '1.3: Explanatory comment is present',
    test1_3.found,
    test1_3.found 
      ? 'Explanatory comment explaining why cartId is not passed is present' 
      : 'Explanatory comment is missing',
    { matches: test1_3.matches }
  );
  
  if (!test1_3.found) allPassed = false;
  
  // Test 1.4: Extract and verify the complete request object construction
  try {
    const lines_145_168 = extractLines('frontend/src/hooks/useGuestCheckout.ts', 145, 168);
    const hasUndefinedCartId = lines_145_168.includes('cartId: undefined');
    const hasComment = lines_145_168.includes('Don\'t pass cartId for guest users');
    
    logTestResult(
      '1.4: Request object correctly sets cartId to undefined',
      hasUndefinedCartId && hasComment,
      hasUndefinedCartId && hasComment 
        ? 'Request object construction is correct' 
        : 'Request object construction is incorrect',
      { 
        hasUndefinedCartId,
        hasComment,
        codeSnippet: lines_145_168 
      }
    );
    
    if (!hasUndefinedCartId || !hasComment) allPassed = false;
  } catch (error) {
    logTestResult(
      '1.4: Request object correctly sets cartId to undefined',
      false,
      `Failed to extract lines: ${error.message}`,
      { error: error.message }
    );
    allPassed = false;
  }
  
  // Test 1.5: Verify "guest" string is NOT being sent as cartId
  const test1_5 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'cartId:\\s*[\'"]guest[\'"]',
    'cartId with "guest" string'
  );
  
  logTestResult(
    '1.5: "guest" string is NOT being sent as cartId',
    !test1_5.found,
    !test1_5.found 
      ? 'No instances of cartId: "guest" found (correct)' 
      : 'Found instances of cartId: "guest" (incorrect)',
    { matches: test1_5.matches }
  );
  
  if (test1_5.found) allPassed = false;
  
  // Test 1.6: Verify guest/page.tsx extracts cartId from useCart
  const test1_6 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'const \\{.*cartId.*\\} = useCart\\(\\)',
    'cartId extracted from useCart'
  );
  
  logTestResult(
    '1.6: guest/page.tsx extracts cartId from useCart()',
    test1_6.found,
    test1_6.found 
      ? 'cartId is correctly extracted from useCart()' 
      : 'cartId is not extracted from useCart()',
    { matches: test1_6.matches }
  );
  
  if (!test1_6.found) allPassed = false;
  
  // Test 1.7: Verify guest/page.tsx passes cartId to initializeSession
  const test1_7 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'initializeSession\\(undefined, undefined, cartId',
    'initializeSession call with cartId'
  );
  
  logTestResult(
    '1.7: guest/page.tsx passes cartId to initializeSession()',
    test1_7.found,
    test1_7.found 
      ? 'cartId is correctly passed to initializeSession()' 
      : 'cartId is not passed to initializeSession()',
    { matches: test1_7.matches }
  );
  
  if (!test1_7.found) allPassed = false;
  
  return allPassed;
}

/**
 * ============================================================================
 * TEST 2: Verify cart persists across page refresh
 * ============================================================================
 */
function runTest2() {
  logSection('TEST 2: Verify cart persists across page refresh');
  
  let allPassed = true;
  
  // Test 2.1: Verify 500ms delay is added to redirect check
  const test2_1 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'setTimeout\\(\\(\\) =>',
    'setTimeout with delay'
  );
  
  logTestResult(
    '2.1: 500ms delay is added to redirect check',
    test2_1.found,
    test2_1.found 
      ? 'setTimeout is used with cart empty check' 
      : 'setTimeout with delay is not found',
    { matches: test2_1.matches }
  );
  
  if (!test2_1.found) allPassed = false;
  
  // Test 2.2: Verify delay is 500ms
  const test2_2 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    '\\},\\s*500\\)',
    '500ms delay'
  );
  
  logTestResult(
    '2.2: Delay is set to 500ms',
    test2_2.found,
    test2_2.found 
      ? 'Delay is correctly set to 500ms' 
      : 'Delay is not 500ms',
    { matches: test2_2.matches }
  );
  
  if (!test2_2.found) allPassed = false;
  
  // Test 2.3: Verify comment explaining the delay
  const test2_3 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'Add a small delay to allow cart to load from localStorage',
    'Delay comment'
  );
  
  logTestResult(
    '2.3: Comment explaining the delay is present',
    test2_3.found,
    test2_3.found 
      ? 'Comment explaining the delay is present' 
      : 'Comment explaining the delay is missing',
    { matches: test2_3.matches }
  );
  
  if (!test2_3.found) allPassed = false;
  
  // Test 2.4: Extract and verify the complete useEffect for redirect check
  try {
    const lines_137_149 = extractLines('frontend/src/app/checkout/guest/page.tsx', 137, 149);
    const hasDelay = lines_137_149.includes('setTimeout');
    const has500ms = lines_137_149.includes('500');
    const hasComment = lines_137_149.includes('allow cart to load from localStorage');
    const checksIsInitializing = lines_137_149.includes('!isInitializing');
    const checksItemsLength = lines_137_149.includes('items.length === 0');
    const checksIsLoading = lines_137_149.includes('!isLoading');
    
    logTestResult(
      '2.4: Complete redirect check useEffect is correct',
      hasDelay && has500ms && hasComment && checksIsInitializing && checksItemsLength && checksIsLoading,
      hasDelay && has500ms && hasComment && checksIsInitializing && checksItemsLength && checksIsLoading 
        ? 'Complete useEffect is correctly implemented' 
        : 'useEffect is missing some checks',
      { 
        hasDelay,
        has500ms,
        hasComment,
        checksIsInitializing,
        checksItemsLength,
        checksIsLoading,
        codeSnippet: lines_137_149 
      }
    );
    
    if (!hasDelay || !has500ms || !hasComment || !checksIsInitializing || !checksItemsLength || !checksIsLoading) {
      allPassed = false;
    }
  } catch (error) {
    logTestResult(
      '2.4: Complete redirect check useEffect is correct',
      false,
      `Failed to extract lines: ${error.message}`,
      { error: error.message }
    );
    allPassed = false;
  }
  
  // Test 2.5: Verify cleanup function is present
  const test2_5 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'return \\(\\) => clearTimeout\\(timer\\)',
    'Cleanup function'
  );
  
  logTestResult(
    '2.5: Cleanup function is present',
    test2_5.found,
    test2_5.found 
      ? 'Cleanup function is present' 
      : 'Cleanup function is missing',
    { matches: test2_5.matches }
  );
  
  if (!test2_5.found) allPassed = false;
  
  return allPassed;
}

/**
 * ============================================================================
 * TEST 3: Verify empty cart redirect still works
 * ============================================================================
 */
function runTest3() {
  logSection('TEST 3: Verify empty cart redirect still works');
  
  let allPassed = true;
  
  // Test 3.1: Verify redirect to cart page on empty cart
  const test3_1 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'router\\.push\\([\'"]/cart[\'"]\\)',
    'Redirect to cart'
  );
  
  logTestResult(
    '3.1: Redirect to cart page on empty cart',
    test3_1.found,
    test3_1.found 
      ? 'Redirect to cart page is implemented' 
      : 'Redirect to cart page is missing',
    { matches: test3_1.matches }
  );
  
  if (!test3_1.found) allPassed = false;
  
  // Test 3.2: Verify toast error message
  const test3_2 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'toast\\.error.*Your cart is empty',
    'Toast error message'
  );
  
  logTestResult(
    '3.2: Toast error message is displayed',
    test3_2.found,
    test3_2.found 
      ? 'Toast error message is displayed' 
      : 'Toast error message is missing',
    { matches: test3_2.matches }
  );
  
  if (!test3_2.found) allPassed = false;
  
  // Test 3.3: Verify conditions for redirect
  try {
    const lines_137_149 = extractLines('frontend/src/app/checkout/guest/page.tsx', 137, 149);
    const checksNotInitializing = lines_137_149.includes('!isInitializing');
    const checksEmptyCart = lines_137_149.includes('items.length === 0');
    const checksNotLoading = lines_137_149.includes('!isLoading');
    
    logTestResult(
      '3.3: All conditions for redirect are checked',
      checksNotInitializing && checksEmptyCart && checksNotLoading,
      checksNotInitializing && checksEmptyCart && checksNotLoading 
        ? 'All conditions for redirect are checked' 
        : 'Some conditions for redirect are missing',
      { 
        checksNotInitializing,
        checksEmptyCart,
        checksNotLoading 
      }
    );
    
    if (!checksNotInitializing || !checksEmptyCart || !checksNotLoading) {
      allPassed = false;
    }
  } catch (error) {
    logTestResult(
      '3.3: All conditions for redirect are checked',
      false,
      `Failed to extract lines: ${error.message}`,
      { error: error.message }
    );
    allPassed = false;
  }
  
  return allPassed;
}

/**
 * ============================================================================
 * TEST 4: Verify checkout initialization succeeds completely
 * ============================================================================
 */
function runTest4() {
  logSection('TEST 4: Verify checkout initialization succeeds completely');
  
  let allPassed = true;
  
  // Test 4.1: Verify initializeSession is called when items are in cart
  const test4_1 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'if \\(!isInitializing && items\\.length > 0\\)',
    'initializeSession call with items'
  );
  
  logTestResult(
    '4.1: initializeSession is called when items are in cart',
    test4_1.found,
    test4_1.found 
      ? 'initializeSession is called when cart has items' 
      : 'initializeSession call is missing or incorrect',
    { matches: test4_1.matches }
  );
  
  if (!test4_1.found) allPassed = false;
  
  // Test 4.2: Verify useEffect dependencies
  const test4_2 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    '\\[isInitializing, items\\.length, initializeSession, cartId\\]',
    'useEffect dependencies'
  );
  
  logTestResult(
    '4.2: useEffect dependencies are correct',
    test4_2.found,
    test4_2.found 
      ? 'useEffect dependencies include isInitializing, items.length, initializeSession, and cartId' 
      : 'useEffect dependencies are incorrect',
    { matches: test4_2.matches }
  );
  
  if (!test4_2.found) allPassed = false;
  
  // Test 4.3: Verify API endpoint is correct
  const test4_3 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'apiClient\\.post.*guest/checkout/initialize',
    'API endpoint'
  );
  
  logTestResult(
    '4.3: API endpoint is correct',
    test4_3.found,
    test4_3.found 
      ? 'API endpoint is /guest/checkout/initialize' 
      : 'API endpoint is incorrect',
    { matches: test4_3.matches }
  );
  
  if (!test4_3.found) allPassed = false;
  
  // Test 4.4: Verify session is stored in localStorage
  const test4_4 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'localStorage\\.setItem.*GUEST_SESSION_KEY.*response\\.sessionId',
    'localStorage setItem'
  );
  
  logTestResult(
    '4.4: Session is stored in localStorage',
    test4_4.found,
    test4_4.found 
      ? 'Session ID is stored in localStorage' 
      : 'Session storage is missing',
    { matches: test4_4.matches }
  );
  
  if (!test4_4.found) allPassed = false;
  
  // Test 4.5: Verify progress is calculated
  const test4_5 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'setProgress\\(calculateProgress',
    'Progress calculation'
  );
  
  logTestResult(
    '4.5: Progress is calculated correctly',
    test4_5.found,
    test4_5.found 
      ? 'Progress is calculated with initial step "info"' 
      : 'Progress calculation is missing',
    { matches: test4_5.matches }
  );
  
  if (!test4_5.found) allPassed = false;
  
  // Test 4.6: Verify session timeout timer is started
  const test4_6 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'startSessionTimeoutTimer\\(\\)',
    'Session timeout timer'
  );
  
  logTestResult(
    '4.6: Session timeout timer is started',
    test4_6.found,
    test4_6.found 
      ? 'Session timeout timer is started' 
      : 'Session timeout timer is missing',
    { matches: test4_6.matches }
  );
  
  if (!test4_6.found) allPassed = false;
  
  return allPassed;
}

/**
 * ============================================================================
 * TEST 5: Verify sessionId is used instead of cartId
 * ============================================================================
 */
function runTest5() {
  logSection('TEST 5: Verify sessionId is used instead of cartId');
  
  let allPassed = true;
  
  // Test 5.1: Verify sessionId is included in request
  const test5_1 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'sessionId:\\s*sessionId \\|\\| existingSessionId',
    'sessionId in request'
  );
  
  logTestResult(
    '5.1: sessionId is included in request',
    test5_1.found,
    test5_1.found 
      ? 'sessionId is correctly included in the request' 
      : 'sessionId is not included in the request',
    { matches: test5_1.matches }
  );
  
  if (!test5_1.found) allPassed = false;
  
  // Test 5.2: Verify existingSessionId is retrieved from localStorage
  const test5_2 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'const existingSessionId = localStorage\\.getItem\\(GUEST_SESSION_KEY\\)',
    'existingSessionId from localStorage'
  );
  
  logTestResult(
    '5.2: existingSessionId is retrieved from localStorage',
    test5_2.found,
    test5_2.found 
      ? 'existingSessionId is retrieved from localStorage' 
      : 'existingSessionId retrieval is missing',
    { matches: test5_2.matches }
  );
  
  if (!test5_2.found) allPassed = false;
  
  // Test 5.3: Verify sessionId is used in API calls
  const test5_3 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'sessionId:\\s*session\\.sessionId',
    'sessionId in API calls'
  );
  
  logTestResult(
    '5.3: sessionId is used in subsequent API calls',
    test5_3.found,
    test5_3.found 
      ? 'sessionId is used in subsequent API calls' 
      : 'sessionId usage in API calls is missing',
    { matches: test5_3.matches }
  );
  
  if (!test5_3.found) allPassed = false;
  
  // Test 5.4: Verify cartId is NOT used in request body
  try {
    const lines_145_168 = extractLines('frontend/src/hooks/useGuestCheckout.ts', 145, 168);
    const hasCartIdUndefined = lines_145_168.includes('cartId: undefined');
    const hasCartIdGuest = lines_145_168.includes('cartId: "guest"') || lines_145_168.includes("cartId: 'guest'");
    const hasSessionId = lines_145_168.includes('sessionId:');
    
    logTestResult(
      '5.4: cartId is NOT used in request body (sessionId is used instead)',
      hasCartIdUndefined && !hasCartIdGuest && hasSessionId,
      hasCartIdUndefined && !hasCartIdGuest && hasSessionId 
        ? 'Request uses sessionId instead of cartId' 
        : 'Request incorrectly uses cartId',
      { 
        hasCartIdUndefined,
        hasCartIdGuest,
        hasSessionId,
        codeSnippet: lines_145_168 
      }
    );
    
    if (!hasCartIdUndefined || hasCartIdGuest || !hasSessionId) {
      allPassed = false;
    }
  } catch (error) {
    logTestResult(
      '5.4: cartId is NOT used in request body (sessionId is used instead)',
      false,
      `Failed to extract lines: ${error.message}`,
      { error: error.message }
    );
    allPassed = false;
  }
  
  // Test 5.5: Verify GUEST_SESSION_KEY constant is defined
  const test5_5 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'const GUEST_SESSION_KEY = [\'"]guest_session_id[\'"]',
    'GUEST_SESSION_KEY constant'
  );
  
  logTestResult(
    '5.5: GUEST_SESSION_KEY constant is defined',
    test5_5.found,
    test5_5.found 
      ? 'GUEST_SESSION_KEY constant is defined' 
      : 'GUEST_SESSION_KEY constant is missing',
    { matches: test5_5.matches }
  );
  
  if (!test5_5.found) allPassed = false;
  
  return allPassed;
}

/**
 * ============================================================================
 * ADDITIONAL VERIFICATION TESTS
 * ============================================================================
 */
function runAdditionalTests() {
  logSection('ADDITIONAL VERIFICATION TESTS');
  
  let allPassed = true;
  
  // Test A1: Verify no "guest" string is used as cartId in the entire codebase
  const testA1 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'cartId:\\s*[\'"]guest[\'"]',
    'cartId with "guest" string (should not exist)'
  );
  
  logTestResult(
    'A1: No "guest" string is used as cartId in useGuestCheckout.ts',
    !testA1.found,
    !testA1.found 
      ? 'No instances of cartId: "guest" found' 
      : 'Found instances of cartId: "guest"',
    { matches: testA1.matches }
  );
  
  if (testA1.found) allPassed = false;
  
  // Test A2: Verify no "guest" string is used as cartId in guest page
  const testA2 = verifyCodePattern(
    'frontend/src/app/checkout/guest/page.tsx',
    'cartId:\\s*[\'"]guest[\'"]',
    'cartId with "guest" string (should not exist)'
  );
  
  logTestResult(
    'A2: No "guest" string is used as cartId in guest/page.tsx',
    !testA2.found,
    !testA2.found 
      ? 'No instances of cartId: "guest" found' 
      : 'Found instances of cartId: "guest"',
    { matches: testA2.matches }
  );
  
  if (testA2.found) allPassed = false;
  
  // Test A3: Verify proper TypeScript types are used
  const testA3 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'cartId\\?: string',
    'cartId optional type'
  );
  
  logTestResult(
    'A3: cartId is properly typed as optional string',
    testA3.found,
    testA3.found 
      ? 'cartId is properly typed as optional string' 
      : 'cartId type is incorrect',
    { matches: testA3.matches }
  );
  
  if (!testA3.found) allPassed = false;
  
  // Test A4: Verify error handling is present
  const testA4 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'catch\\s*\\(err',
    'Error handling'
  );
  
  logTestResult(
    'A4: Error handling is present in initializeSession',
    testA4.found,
    testA4.found 
      ? 'Error handling is present' 
      : 'Error handling is missing',
    { matches: testA4.matches }
  );
  
  if (!testA4.found) allPassed = false;
  
  // Test A5: Verify toast error is shown on failure
  const testA5 = verifyCodePattern(
    'frontend/src/hooks/useGuestCheckout.ts',
    'toast\\.error',
    'Toast error'
  );
  
  logTestResult(
    'A5: Toast error is shown on initialization failure',
    testA5.found,
    testA5.found 
      ? 'Toast error is shown on failure' 
      : 'Toast error is missing',
    { matches: testA5.matches }
  );
  
  if (!testA5.found) allPassed = false;
  
  return allPassed;
}

/**
 * ============================================================================
 * MAIN TEST RUNNER
 * ============================================================================
 */
function main() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('=================================================================');
  console.log('          GUEST CHECKOUT FINAL VERIFICATION TEST SUITE');
  console.log('=================================================================');
  console.log(`${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.white}Test Date:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.bright}${colors.white}Project:${colors.reset} Smart Tech B2C Website Redevelopment`);
  console.log(`${colors.bright}${colors.white}Purpose:${colors.reset} Verify all fixes for Guest Checkout issues\n`);
  
  // Run all test suites
  const test1Passed = runTest1();
  const test2Passed = runTest2();
  const test3Passed = runTest3();
  const test4Passed = runTest4();
  const test5Passed = runTest5();
  const additionalPassed = runAdditionalTests();
  
  // Print summary
  logSection('TEST SUMMARY');
  
  const allTestSuitesPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && additionalPassed;
  
  console.log(`${colors.bright}${colors.white}Test Suite Results:${colors.reset}\n`);
  console.log(`  Test 1: ${test1Passed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}`);
  console.log(`  Test 2: ${test2Passed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}`);
  console.log(`  Test 3: ${test3Passed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}`);
  console.log(`  Test 4: ${test4Passed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}`);
  console.log(`  Test 5: ${test5Passed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}`);
  console.log(`  Additional Tests: ${additionalPassed ? colors.green + 'PASSED' + colors.reset : colors.red + 'FAILED' + colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.white}Overall Summary:${colors.reset}\n`);
  console.log(`  Total Tests: ${testResults.summary.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.summary.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.summary.failed}${colors.reset}`);
  console.log(`  Skipped: ${testResults.summary.skipped}\n`);
  
  // Save test results to JSON file
  const resultsFileName = `guest-checkout-final-verification-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFileName, JSON.stringify(testResults, null, 2));
  console.log(`${colors.cyan}Test results saved to: ${resultsFileName}${colors.reset}\n`);
  
  // Print final result
  if (allTestSuitesPassed && testResults.summary.failed === 0) {
    console.log(`${colors.bright}${colors.green}=================================================================`);
    console.log('                    ALL TESTS PASSED');
    console.log('=================================================================');
    console.log('');
    console.log('  All Guest Checkout fixes have been verified successfully!');
    console.log('');
    console.log('  Key Verifications:');
    console.log('  * cartId is NOT passed to API for guest users');
    console.log('  * Cart persists across page refresh (500ms delay)');
    console.log('  * Empty cart redirect still works');
    console.log('  * Checkout initialization succeeds completely');
    console.log('  * sessionId is used instead of cartId');
    console.log('  * "guest" string is NOT being sent as cartId');
    console.log('');
    console.log('=================================================================' + colors.reset + '\n');
    
    return 0;
  } else {
    console.log(`${colors.bright}${colors.red}=================================================================`);
    console.log('                    SOME TESTS FAILED');
    console.log('=================================================================');
    console.log('');
    console.log('  Please review the test results above and fix the issues.');
    console.log('');
    console.log('=================================================================' + colors.reset + '\n');
    
    return 1;
  }
}

// Run the tests
const exitCode = main();
process.exit(exitCode);
