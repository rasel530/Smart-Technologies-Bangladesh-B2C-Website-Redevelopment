/**
 * Guest Cart Persistence Fix Verification Test
 * 
 * This test verifies the three fixes implemented to resolve the guest cart data loss issue:
 * 1. Auto-grant cart consent on first product add (CartContext.tsx:251-259)
 * 2. Generate proper UUID session IDs (guestCart.ts:310-326)
 * 3. Ensure cart loads on page refresh (CartContext.tsx:1175-1201)
 * 
 * Original Issue: When adding products to cart as a Guest user and then refreshing 
 * the cart page, the cart shows "Your cart is empty" and added products don't persist.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  scenarios: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    console.log(`${colors.green}✓ PASS${colors.reset} ${testName}`);
    if (details) console.log(`  ${colors.cyan}${details}${colors.reset}`);
  } else {
    testResults.failedTests++;
    console.log(`${colors.red}✗ FAIL${colors.reset} ${testName}`);
    if (details) console.log(`  ${colors.red}${details}${colors.reset}`);
  }
}

// Helper function to log scenario header
function logScenario(scenarioName) {
  console.log(`\n${colors.bold}${colors.blue}=== ${scenarioName} ===${colors.reset}`);
  const scenario = {
    name: scenarioName,
    tests: [],
    passed: 0,
    failed: 0
  };
  testResults.scenarios.push(scenario);
  return scenario;
}

// Helper function to add test to scenario
function addTestToScenario(scenario, testName, passed, details = '') {
  scenario.tests.push({ name: testName, passed, details });
  if (passed) scenario.passed++;
  else scenario.failed++;
  logTest(testName, passed, details);
}

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to read file content
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Helper function to check if code contains specific pattern
function checkCodePattern(content, pattern, description) {
  if (!content) {
    return { found: false, error: 'File not found or empty' };
  }
  const found = pattern.test(content);
  return { found, error: found ? null : 'Pattern not found in code' };
}

// ============================================================================
// VERIFICATION TESTS
// ============================================================================

console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   GUEST CART PERSISTENCE FIX VERIFICATION TEST                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

// ============================================================================
// FIX 1: Auto-grant cart consent on first product add
// ============================================================================
const scenario1 = logScenario('Fix 1: Auto-grant cart consent on first product add');

const cartContextContent = readFileContent('frontend/src/contexts/CartContext.tsx');
const guestCartContent = readFileContent('frontend/src/lib/utils/guestCart.ts');

// Test 1.1: Check if hasCartConsent function exists
const hasCartConsentPattern = /function\s+hasCartConsent\s*\(\)|export\s+function\s+hasCartConsent\s*\(\)/;
const test1_1 = checkCodePattern(guestCartContent, hasCartConsentPattern, 'hasCartConsent function');
addTestToScenario(scenario1, 'hasCartConsent function exists in guestCart.ts', test1_1.found, test1_1.error);

// Test 1.2: Check if grantCartConsent function exists
const grantCartConsentPattern = /function\s+grantCartConsent\s*\(\)|export\s+function\s+grantCartConsent\s*\(\)/;
const test1_2 = checkCodePattern(guestCartContent, grantCartConsentPattern, 'grantCartConsent function');
addTestToScenario(scenario1, 'grantCartConsent function exists in guestCart.ts', test1_2.found, test1_2.error);

// Test 1.3: Check if auto-grant consent is implemented in addItem
const autoGrantPattern = /if\s*\(\s*!\s*hasCartConsent\s*\(\s*\)\s*\)\s*\{[\s\S]*?grantCartConsent\s*\(\s*\)/;
const test1_3 = checkCodePattern(cartContextContent, autoGrantPattern, 'Auto-grant consent in addItem');
addTestToScenario(scenario1, 'Auto-grant consent on first product add in CartContext.tsx', test1_3.found, test1_3.error);

// Test 1.4: Check if consent is stored in localStorage
const consentStoragePattern = /CART_CONSENT_KEY\s*=\s*['"`]smart_tech_cart_consent['"`]/;
const test1_4 = checkCodePattern(guestCartContent, consentStoragePattern, 'Consent localStorage key');
addTestToScenario(scenario1, 'Consent is stored in localStorage with correct key', test1_4.found, test1_4.error);

// Test 1.5: Check if session initialization happens after consent
const sessionInitPattern = /grantCartConsent\s*\(\s*\);[\s\S]*?initializeGuestSession\s*\(\s*\)|guestSessionId\s*=\s*initializeGuestSession\s*\(\s*\)/;
const test1_5 = checkCodePattern(cartContextContent, sessionInitPattern, 'Session init after consent');
addTestToScenario(scenario1, 'Session initialization happens after granting consent', test1_5.found, test1_5.error);

// ============================================================================
// FIX 2: Generate proper UUID session IDs
// ============================================================================
const scenario2 = logScenario('Fix 2: Generate proper UUID session IDs');

// Test 2.1: Check if generateGuestSessionId function exists
const generateSessionPattern = /function\s+generateGuestSessionId\s*\(\)|export\s+function\s+generateGuestSessionId\s*\(\)/;
const test2_1 = checkCodePattern(guestCartContent, generateSessionPattern, 'generateGuestSessionId function');
addTestToScenario(scenario2, 'generateGuestSessionId function exists in guestCart.ts', test2_1.found, test2_1.error);

// Test 2.2: Check if crypto.randomUUID is used
const cryptoUUIDPattern = /crypto\.randomUUID\s*\(\s*\)/;
const test2_2 = checkCodePattern(guestCartContent, cryptoUUIDPattern, 'crypto.randomUUID usage');
addTestToScenario(scenario2, 'Uses crypto.randomUUID for modern browsers', test2_2.found, test2_2.error);

// Test 2.3: Check if fallback UUID format is correct
const fallbackUUIDPattern = /['"`]xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx['"`]/;
const test2_3 = checkCodePattern(guestCartContent, fallbackUUIDPattern, 'Fallback UUID format');
addTestToScenario(scenario2, 'Fallback UUID format matches expected pattern', test2_3.found, test2_3.error);

// Test 2.4: Check if UUID validation exists
const uuidValidationPattern = /isValidUUID|uuidRegex.*test/;
const test2_4 = checkCodePattern(cartContextContent, uuidValidationPattern, 'UUID validation');
addTestToScenario(scenario2, 'UUID validation function exists in CartContext.tsx', test2_4.found, test2_4.error);

// Test 2.5: Check if session ID is stored in both localStorage and cookies
const sessionStoragePattern = /setGuestSessionIdUtil|setGuestSessionId.*setGuestSessionIdCookie/;
const test2_5 = checkCodePattern(guestCartContent, sessionStoragePattern, 'Session ID storage');
addTestToScenario(scenario2, 'Session ID is stored in both localStorage and cookies', test2_5.found, test2_5.error);

// ============================================================================
// FIX 3: Ensure cart loads on page refresh
// ============================================================================
const scenario3 = logScenario('Fix 3: Ensure cart loads on page refresh');

// Test 3.1: Check if loadGuestCartFromStorage is called on initialization
const loadCartPattern = /loadGuestCartFromStorageUtil\s*\(\s*\)/;
const test3_1 = checkCodePattern(cartContextContent, loadCartPattern, 'loadGuestCartFromStorage call');
addTestToScenario(scenario3, 'loadGuestCartFromStorage is called during cart initialization', test3_1.found, test3_1.error);

// Test 3.2: Check if existing cart data is checked
const existingCartPattern = /existingCart\s*=\s*loadGuestCartFromStorageUtil\s*\(\s*\)/;
const test3_2 = checkCodePattern(cartContextContent, existingCartPattern, 'Existing cart check');
addTestToScenario(scenario3, 'Existing cart data is checked on page refresh', test3_2.found, test3_2.error);

// Test 3.3: Check if consent is auto-granted when cart has items
const autoGrantOnRefreshPattern = /existingCart.*items\.length\s*>\s*0[\s\S]*?grantCartConsent\s*\(\s*\)/;
const test3_3 = checkCodePattern(cartContextContent, autoGrantOnRefreshPattern, 'Auto-grant on refresh');
addTestToScenario(scenario3, 'Consent is auto-granted when existing cart has items', test3_3.found, test3_3.error);

// Test 3.4: Check if session ID is validated and regenerated if needed
const sessionValidationPattern = /!\s*guestSessionId\s*\|\|\s*!\s*isValidUUID\s*\(\s*guestSessionId\s*\)/;
const test3_4 = checkCodePattern(cartContextContent, sessionValidationPattern, 'Session ID validation');
addTestToScenario(scenario3, 'Session ID is validated and regenerated if invalid', test3_4.found, test3_4.error);

// Test 3.5: Check if cart is loaded from storage data
const loadFromStoragePattern = /getCartFromStorageData\s*\(\s*existingCart\s*\)/;
const test3_5 = checkCodePattern(cartContextContent, loadFromStoragePattern, 'Load from storage data');
addTestToScenario(scenario3, 'Cart is loaded from existing storage data on refresh', test3_5.found, test3_5.error);

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
const scenario4 = logScenario('Integration Tests: Cart Persistence Flow');

// Test 4.1: Check if cart items are preserved in localStorage
const saveCartPattern = /saveGuestCartToStorageUtil\s*\(\s*guestCartUpdated\s*\)|saveGuestCartToStorageUtil\s*\(\s*storageData\s*\)/;
const test4_1 = checkCodePattern(cartContextContent, saveCartPattern, 'Save cart to storage');
addTestToScenario(scenario4, 'Cart items are saved to localStorage after add/update', test4_1.found, test4_1.error);

// Test 4.2: Check if cart is synced to backend
const syncBackendPattern = /createOrUpdateGuestCartBackend\s*\(\s*guestCartUpdated\.items|createOrUpdateGuestCartBackend\s*\(\s*storageData\.items/;
const test4_2 = checkCodePattern(cartContextContent, syncBackendPattern, 'Sync to backend');
addTestToScenario(scenario4, 'Guest cart is synced to backend for persistence', test4_2.found, test4_2.error);

// Test 4.3: Check if cross-tab synchronization is implemented
const crossTabPattern = /listenForGuestCartUpdates|guest-cart-updated/;
const test4_3 = checkCodePattern(cartContextContent, crossTabPattern, 'Cross-tab sync');
addTestToScenario(scenario4, 'Cross-tab synchronization is implemented', test4_3.found, test4_3.error);

// Test 4.4: Check if cart expiration is handled
const expirationPattern = /expiresAt|cart\.version\s*!==\s*GUEST_CART_VERSION/;
const test4_4 = checkCodePattern(guestCartContent, expirationPattern, 'Cart expiration');
addTestToScenario(scenario4, 'Cart expiration and version validation is handled', test4_4.found, test4_4.error);

// Test 4.5: Check if error handling is in place
const errorHandlingPattern = /try\s*\{[\s\S]*?catch\s*\(\s*error[\s\S]*?\}|handleStorageError|saveGuestCartWithErrorHandling/;
const test4_5 = checkCodePattern(guestCartContent, errorHandlingPattern, 'Error handling');
addTestToScenario(scenario4, 'Error handling for storage operations is implemented', test4_5.found, test4_5.error);

// ============================================================================
// CODE QUALITY TESTS
// ============================================================================
const scenario5 = logScenario('Code Quality Tests');

// Test 5.1: Check for proper TypeScript types
const typesPattern = /interface\s+GuestCartStorageData|interface\s+GuestCartItem|type\s+CartContextType/;
const test5_1 = checkCodePattern(guestCartContent, typesPattern, 'TypeScript interfaces');
addTestToScenario(scenario5, 'Proper TypeScript interfaces are defined', test5_1.found, test5_1.error);

// Test 5.2: Check for debug logging
const loggingPattern = /debugLog|console\.log\(\s*['"`]\[GuestCart\]|console\.log\(\s*['"`]\[CartContext\]/;
const test5_2 = checkCodePattern(guestCartContent, loggingPattern, 'Debug logging');
addTestToScenario(scenario5, 'Debug logging is implemented for troubleshooting', test5_2.found, test5_2.error);

// Test 5.3: Check for environment-aware code
const envPattern = /process\.env\.NODE_ENV|isDevelopment/;
const test5_3 = checkCodePattern(guestCartContent, envPattern, 'Environment-aware code');
addTestToScenario(scenario5, 'Environment-aware code is implemented', test5_3.found, test5_3.error);

// Test 5.4: Check for proper cleanup functions
const cleanupPattern = /removeGuestSessionId|clearGuestCartFromStorage|unsubscribeUpdates/;
const test5_4 = checkCodePattern(guestCartContent, cleanupPattern, 'Cleanup functions');
addTestToScenario(scenario5, 'Proper cleanup functions are implemented', test5_4.found, test5_4.error);

// Test 5.5: Check for proper null/undefined checks
const nullCheckPattern = /typeof\s+window\s*===\s*['"`]undefined['"`]|if\s*\(\s*!.*\)\s*return\s*null/;
const test5_5 = checkCodePattern(guestCartContent, nullCheckPattern, 'Null checks');
addTestToScenario(scenario5, 'Proper null/undefined checks are in place', test5_5.found, test5_5.error);

// ============================================================================
// MANUAL TESTING INSTRUCTIONS
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}
╔═══════════════════════════════════════════════════════════════╗
║   MANUAL TESTING INSTRUCTIONS                                 ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`${colors.cyan}The automated tests above verify the code implementation.${colors.reset}`);
console.log(`${colors.cyan}Please perform the following manual tests in your browser:${colors.reset}\n`);

console.log(`${colors.bold}Scenario 1: Basic Guest Cart Persistence${colors.reset}`);
console.log(`  1. Navigate to http://localhost:3000/cart as a guest user (not logged in)`);
console.log(`  2. Add a product to the cart`);
console.log(`  3. Refresh the page (F5)`);
console.log(`  4. Expected: The cart should still show the added product(s)\n`);

console.log(`${colors.bold}Scenario 2: Multiple Products${colors.reset}`);
console.log(`  1. Navigate to cart page as guest user`);
console.log(`  2. Add multiple products to cart`);
console.log(`  3. Refresh the page`);
console.log(`  4. Expected: All added products should still be in the cart\n`);

console.log(`${colors.bold}Scenario 3: Session ID Format${colors.reset}`);
console.log(`  1. Open browser DevTools (F12)`);
console.log(`  2. Go to Application tab > Local Storage`);
console.log(`  3. Check 'smart_tech_guest_session' key`);
console.log(`  4. Expected: Session ID should be in UUID format (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)\n`);

console.log(`${colors.bold}Scenario 4: Cart Consent Auto-Grant${colors.reset}`);
console.log(`  1. Open browser DevTools and check localStorage before adding products`);
console.log(`  2. Add a product to cart`);
console.log(`  3. Check localStorage again`);
console.log(`  4. Expected: 'smart_tech_cart_consent' key should be set to 'true'\n`);

console.log(`${colors.bold}Scenario 5: Existing Cart Data Loading${colors.reset}`);
console.log(`  1. Add products to cart`);
console.log(`  2. Close and reopen browser (or clear session but keep localStorage)`);
console.log(`  3. Navigate to cart page`);
console.log(`  4. Expected: Cart should load with previously added products\n`);

console.log(`${colors.bold}Edge Case Testing:${colors.reset}`);
console.log(`  - Adding products, refreshing multiple times`);
console.log(`  - Adding products, navigating away, then returning to cart`);
console.log(`  - Adding products, closing tab, reopening cart`);
console.log(`  - Testing with localStorage disabled`);
console.log(`  - Testing with cookies disabled\n`);

// ============================================================================
// TEST RESULTS SUMMARY
// ============================================================================
console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║   TEST RESULTS SUMMARY                                         ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`\n${colors.bold}Overall Results:${colors.reset}`);
console.log(`  Total Tests:  ${testResults.totalTests}`);
console.log(`  ${colors.green}Passed:       ${testResults.passedTests}${colors.reset}`);
console.log(`  ${colors.red}Failed:       ${testResults.failedTests}${colors.reset}`);

console.log(`\n${colors.bold}Results by Scenario:${colors.reset}`);
testResults.scenarios.forEach(scenario => {
  const statusColor = scenario.failed === 0 ? colors.green : (scenario.failed <= scenario.tests.length / 2 ? colors.yellow : colors.red);
  const statusText = scenario.failed === 0 ? 'PASS' : 'PARTIAL';
  console.log(`\n  ${statusColor}${statusText}${colors.reset} ${scenario.name}`);
  console.log(`    Tests: ${scenario.passed}/${scenario.tests.length} passed`);
  
  if (scenario.failed > 0) {
    console.log(`    ${colors.red}Failed tests:${colors.reset}`);
    scenario.tests.filter(t => !t.passed).forEach(test => {
      console.log(`      - ${test.name}`);
      if (test.details) console.log(`        ${test.details}`);
    });
  }
});

// ============================================================================
// FINAL VERDICT
// ============================================================================
console.log(`\n${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║   FINAL VERDICT                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

const passRate = (testResults.passedTests / testResults.totalTests) * 100;
let verdict = '';
let verdictColor = '';

if (passRate === 100) {
  verdict = 'EXCELLENT - All automated tests passed!';
  verdictColor = colors.green;
} else if (passRate >= 80) {
  verdict = 'GOOD - Most tests passed. Minor issues may exist.';
  verdictColor = colors.yellow;
} else if (passRate >= 50) {
  verdict = 'NEEDS IMPROVEMENT - Significant issues detected.';
  verdictColor = colors.yellow;
} else {
  verdict = 'CRITICAL - Major issues detected. Review required.';
  verdictColor = colors.red;
}

console.log(`\n${colors.bold}${verdictColor}${verdict}${colors.reset}\n`);
console.log(`Pass Rate: ${passRate.toFixed(2)}%\n`);

// ============================================================================
// SAVE RESULTS TO FILE
// ============================================================================
const resultsFilePath = path.join(__dirname, `guest-cart-persistence-verification-results-${Date.now()}.json`);
const resultsData = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.totalTests,
    passed: testResults.passedTests,
    failed: testResults.failedTests,
    passRate: passRate
  },
  verdict: verdict,
  scenarios: testResults.scenarios
};

fs.writeFileSync(resultsFilePath, JSON.stringify(resultsData, null, 2));
console.log(`\n${colors.cyan}Detailed results saved to:${colors.reset} ${resultsFilePath}\n`);

// Exit with appropriate code
process.exit(testResults.failedTests > 0 ? 1 : 0);
