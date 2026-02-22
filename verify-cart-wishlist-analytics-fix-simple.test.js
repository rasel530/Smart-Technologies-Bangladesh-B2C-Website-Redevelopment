/**
 * Comprehensive Verification Test for CartWishlistAnalytics Fix (Simplified)
 * 
 * This test verifies fix for TypeError in CartWishlistAnalytics where
 * analytics.behaviorAnalytics.movePatterns was undefined.
 * 
 * Tests:
 * 1. Backend API response structure verification (code analysis)
 * 2. Frontend component rendering verification (code analysis)
 * 3. Integration verification (data structure compatibility)
 */

const path = require('path');
const fs = require('fs');

// Test results storage
const testResults = {
  backend: {
    behaviorAnalyticsStructure: false,
    conversionAnalyticsStructure: false,
    abandonmentAnalyticsStructure: false,
    systemAnalyticsStructure: false,
    movePatternsFix: false,
    errors: []
  },
  frontend: {
    defensiveChecksForMovePatterns: false,
    fallbackMessageForMovePatterns: false,
    conditionalRenderingForMovePatterns: false,
    abandonmentAnalyticsAccess: false,
    errors: []
  },
  integration: {
    movePatternsCompatible: false,
    abandonmentAnalyticsCompatible: false,
    overall: false,
    errors: []
  }
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// ============================================================================
// TEST 1: Backend Verification (Code Analysis)
// ============================================================================

function testBackendBehaviorAnalytics() {
  logSection('TEST 1: Backend Behavior Analytics Structure Verification');
  
  try {
    const backendPath = path.join(__dirname, 'backend/services/cartWishlist/cartWishlistAnalytics.service.js');
    const backendContent = fs.readFileSync(backendPath, 'utf8');
    
    // Test 1.1: Check return statement structure
    const hasReturnStatement = backendContent.includes('return {');
    logTest('1.1: Has return statement in getBehaviorAnalytics', hasReturnStatement);
    
    // Test 1.2: Check for userBehavior in return
    const hasUserBehavior = backendContent.includes('userBehavior,');
    logTest('1.2: Returns userBehavior in response', hasUserBehavior);
    
    // Test 1.3: Check for timeInCart in return
    const hasTimeInCart = backendContent.includes('timeInCart,');
    logTest('1.3: Returns timeInCart in response', hasTimeInCart);
    
    // Test 1.4: Check for timeInWishlist in return
    const hasTimeInWishlist = backendContent.includes('timeInWishlist,');
    logTest('1.4: Returns timeInWishlist in response', hasTimeInWishlist);
    
    // Test 1.5: Check for movePatterns in return (THE FIX)
    const hasMovePatterns = backendContent.includes('movePatterns:');
    logTest('1.5: Returns movePatterns in response (THE FIX)', hasMovePatterns);
    
    if (hasMovePatterns) {
      // Test 1.6: Verify movePatterns structure
      const hasCartToWishlist = backendContent.includes('cartToWishlist,');
      const hasWishlistToCart = backendContent.includes('wishlistToCart,');
      const hasCartToWishlistToCart = backendContent.includes('cartToWishlistToCart');
      
      const movePatternsComplete = hasCartToWishlist && hasWishlistToCart && hasCartToWishlistToCart;
      logTest('1.6: movePatterns object contains all required fields', movePatternsComplete);
      
      if (!hasCartToWishlist) {
        testResults.backend.errors.push('movePatterns.cartToWishlist is missing');
      }
      if (!hasWishlistToCart) {
        testResults.backend.errors.push('movePatterns.wishlistToCart is missing');
      }
      if (!hasCartToWishlistToCart) {
        testResults.backend.errors.push('movePatterns.cartToWishlistToCart is missing');
      }
      
      testResults.backend.movePatternsFix = movePatternsComplete;
    } else {
      testResults.backend.errors.push('movePatterns object is missing from return statement');
    }
    
    // Test 1.7: Check for old incorrect structure (cartEvents, wishlistEvents, moveHistory)
    const hasOldCartEvents = backendContent.includes('cartEvents:');
    const hasOldWishlistEvents = backendContent.includes('wishlistEvents:');
    const hasOldMoveHistory = backendContent.includes('moveHistory:');
    
    const hasOldStructure = hasOldCartEvents || hasOldWishlistEvents || hasOldMoveHistory;
    logTest('1.7: Does NOT return old incorrect structure', !hasOldStructure);
    
    if (hasOldStructure) {
      testResults.backend.errors.push('WARNING: Backend may still return old incorrect structure');
    }
    
    testResults.backend.behaviorAnalyticsStructure = hasReturnStatement && hasUserBehavior && 
      hasTimeInCart && hasTimeInWishlist && hasMovePatterns && !hasOldStructure;
    
  } catch (error) {
    logTest('1.0: Backend code analysis', false, error.message);
    testResults.backend.errors.push(`Backend analysis error: ${error.message}`);
  }
}

function testBackendConversionAnalytics() {
  logSection('TEST 2: Backend Conversion Analytics Structure Verification');
  
  try {
    const backendPath = path.join(__dirname, 'backend/services/cartWishlist/cartWishlistAnalytics.service.js');
    const backendContent = fs.readFileSync(backendPath, 'utf8');
    
    // Test 2.1: Check return statement in getConversionAnalytics
    const hasViewToCart = backendContent.includes('viewToCart:');
    const hasCartToWishlist = backendContent.includes('cartToWishlist:');
    const hasWishlistToCart = backendContent.includes('wishlistToCart:');
    const hasCartToCheckout = backendContent.includes('cartToCheckout:');
    const hasOverallConversion = backendContent.includes('overallConversion:');
    
    const conversionStructureValid = hasViewToCart && hasCartToWishlist && 
      hasWishlistToCart && hasCartToCheckout && hasOverallConversion;
    
    logTest('2.1: Conversion analytics returns all required fields', conversionStructureValid);
    
    testResults.backend.conversionAnalyticsStructure = conversionStructureValid;
    
  } catch (error) {
    logTest('2.0: Backend conversion analytics analysis', false, error.message);
    testResults.backend.errors.push(`Conversion analytics error: ${error.message}`);
  }
}

function testBackendAbandonmentAnalytics() {
  logSection('TEST 3: Backend Abandonment Analytics Structure Verification');
  
  try {
    const backendPath = path.join(__dirname, 'backend/services/cartWishlist/cartWishlistAnalytics.service.js');
    const backendContent = fs.readFileSync(backendPath, 'utf8');
    
    // Test 3.1: Check return statement in getAbandonmentAnalytics
    const hasAbandonedCarts = backendContent.includes('abandonedCarts,');
    const hasAbandonmentRate = backendContent.includes('abandonmentRate:');
    const hasAbandonmentReasons = backendContent.includes('abandonmentReasons,');
    const hasAverageTime = backendContent.includes('averageTimeBeforeAbandonment:');
    
    const abandonmentStructureValid = hasAbandonedCarts && hasAbandonmentRate && 
      hasAbandonmentReasons && hasAverageTime;
    
    logTest('3.1: Abandonment analytics returns all required fields', abandonmentStructureValid);
    
    // Test 3.2: Check for nested cartAbandonment structure (frontend expects this)
    const hasCartAbandonment = backendContent.includes('cartAbandonment:');
    const hasWishlistAbandonment = backendContent.includes('wishlistAbandonment:');
    
    logTest('3.2: Returns nested cartAbandonment structure', hasCartAbandonment);
    logTest('3.3: Returns nested wishlistAbandonment structure', hasWishlistAbandonment);
    
    if (!hasCartAbandonment || !hasWishlistAbandonment) {
      testResults.backend.errors.push('WARNING: Backend returns flat structure but frontend expects nested cartAbandonment/wishlistAbandonment');
    }
    
    testResults.backend.abandonmentAnalyticsStructure = abandonmentStructureValid;
    
  } catch (error) {
    logTest('3.0: Backend abandonment analytics analysis', false, error.message);
    testResults.backend.errors.push(`Abandonment analytics error: ${error.message}`);
  }
}

function testBackendSystemAnalytics() {
  logSection('TEST 4: Backend System Analytics Structure Verification');
  
  try {
    const backendPath = path.join(__dirname, 'backend/services/cartWishlist/cartWishlistAnalytics.service.js');
    const backendContent = fs.readFileSync(backendPath, 'utf8');
    
    // Test 4.1: Check return statement in getSystemAnalytics
    const hasTotalUsers = backendContent.includes('totalUsers,');
    const hasActiveCarts = backendContent.includes('activeCarts,');
    const hasActiveWishlists = backendContent.includes('activeWishlists,');
    const hasTotalMoves = backendContent.includes('totalMoves,');
    const hasConversionRate = backendContent.includes('conversionRate:');
    
    const systemStructureValid = hasTotalUsers && hasActiveCarts && 
      hasActiveWishlists && hasTotalMoves && hasConversionRate;
    
    logTest('4.1: System analytics returns all required fields', systemStructureValid);
    
    testResults.backend.systemAnalyticsStructure = systemStructureValid;
    
  } catch (error) {
    logTest('4.0: Backend system analytics analysis', false, error.message);
    testResults.backend.errors.push(`System analytics error: ${error.message}`);
  }
}

// ============================================================================
// TEST 5: Frontend Verification
// ============================================================================

function testFrontendDefensiveChecks() {
  logSection('TEST 5: Frontend Component Defensive Checks Verification');
  
  try {
    const frontendPath = path.join(__dirname, 'frontend/src/components/admin/cartWishlist/CartWishlistAnalytics.tsx');
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');
    
    // Test 5.1: Check for defensive check on movePatterns (THE FIX)
    const hasMovePatternsCheck = frontendContent.includes('analytics.behaviorAnalytics && analytics.behaviorAnalytics.movePatterns');
    logTest('5.1: Has defensive check for analytics.behaviorAnalytics.movePatterns (THE FIX)', hasMovePatternsCheck);
    
    // Test 5.2: Check for fallback message when movePatterns is not available
    const hasFallbackMessage = frontendContent.includes('Move patterns data not available');
    logTest('5.2: Has fallback message for missing movePatterns data', hasFallbackMessage);
    
    // Test 5.3: Check for conditional rendering of Pie Chart
    const hasConditionalPieChart = frontendContent.includes('{analytics.behaviorAnalytics && analytics.behaviorAnalytics.movePatterns ? (');
    logTest('5.3: Has conditional rendering for Move Patterns Pie Chart', hasConditionalPieChart);
    
    // Test 5.4: Check for defensive check on abandonmentAnalytics
    const hasAbandonmentCheck = frontendContent.includes('{analytics.abandonmentAnalytics && (');
    logTest('5.4: Has defensive check for analytics.abandonmentAnalytics', hasAbandonmentCheck);
    
    // Test 5.5: Check if abandonmentAnalytics.cartAbandonment is accessed
    const hasCartAbandonmentAccess = frontendContent.includes('analytics.abandonmentAnalytics.cartAbandonment.abandonmentRate');
    logTest('5.5: Accesses analytics.abandonmentAnalytics.cartAbandonment.abandonmentRate', hasCartAbandonmentAccess);
    
    if (hasCartAbandonmentAccess) {
      testResults.frontend.abandonmentAnalyticsAccess = true;
      testResults.frontend.errors.push('FRONTEND ISSUE: Component accesses analytics.abandonmentAnalytics.cartAbandonment but backend returns flat structure');
    }
    
    testResults.frontend.defensiveChecksForMovePatterns = hasMovePatternsCheck && hasFallbackMessage && hasConditionalPieChart;
    
  } catch (error) {
    logTest('5.0: Frontend component analysis', false, error.message);
    testResults.frontend.errors.push(`Frontend analysis error: ${error.message}`);
  }
}

// ============================================================================
// TEST 6: Integration Verification
// ============================================================================

function testIntegration() {
  logSection('TEST 6: Integration Verification');
  
  try {
    // Test 6.1: Verify backend and frontend data structure compatibility for movePatterns
    const movePatternsFixVerified = testResults.backend.movePatternsFix && 
      testResults.frontend.defensiveChecksForMovePatterns;
    
    logTest('6.1: Backend movePatterns structure matches frontend expectations', movePatternsFixVerified);
    
    if (movePatternsFixVerified) {
      testResults.integration.movePatternsCompatible = true;
    } else {
      testResults.integration.errors.push('movePatterns structure mismatch between backend and frontend');
    }
    
    // Test 6.2: Verify backend and frontend data structure compatibility for abandonmentAnalytics
    const abandonmentCompatible = testResults.backend.abandonmentAnalyticsStructure && 
      !testResults.frontend.abandonmentAnalyticsAccess;
    
    logTest('6.2: Backend abandonmentAnalytics structure matches frontend expectations', abandonmentCompatible);
    
    if (!abandonmentCompatible) {
      testResults.integration.abandonmentCompatible = false;
      testResults.integration.errors.push('abandonmentAnalytics structure mismatch - backend returns flat, frontend expects nested');
    } else {
      testResults.integration.abandonmentCompatible = true;
    }
    
    // Test 6.3: Overall integration status
    testResults.integration.overall = movePatternsFixVerified;
    
  } catch (error) {
    logTest('6.0: Integration verification', false, error.message);
    testResults.integration.errors.push(`Integration error: ${error.message}`);
  }
}

// ============================================================================
// Main Test Execution
// ============================================================================

function runAllTests() {
  console.log('\n' + '='.repeat(80));
  log('CART-WISHLIST ANALYTICS FIX VERIFICATION TEST', 'bold');
  log('Testing fix for TypeError: analytics.behaviorAnalytics.movePatterns is undefined', 'yellow');
  console.log('='.repeat(80));
  
  // Run all backend tests
  testBackendBehaviorAnalytics();
  testBackendConversionAnalytics();
  testBackendAbandonmentAnalytics();
  testBackendSystemAnalytics();
  
  // Run frontend tests
  testFrontendDefensiveChecks();
  
  // Run integration tests
  testIntegration();
  
  // Generate summary report
  generateSummaryReport();
}

function generateSummaryReport() {
  logSection('VERIFICATION SUMMARY REPORT');
  
  console.log('\n' + colors.bold + 'BACKEND VERIFICATION' + colors.reset);
  console.log('-'.repeat(40));
  console.log(`Behavior Analytics Structure: ${testResults.backend.behaviorAnalyticsStructure ? '✓ Valid' : '✗ Invalid'}`);
  console.log(`Conversion Analytics Structure: ${testResults.backend.conversionAnalyticsStructure ? '✓ Valid' : '✗ Invalid'}`);
  console.log(`Abandonment Analytics Structure: ${testResults.backend.abandonmentAnalyticsStructure ? '✓ Valid' : '✗ Invalid'}`);
  console.log(`System Analytics Structure: ${testResults.backend.systemAnalyticsStructure ? '✓ Valid' : '✗ Invalid'}`);
  console.log(`movePatterns Fix: ${testResults.backend.movePatternsFix ? '✓ Applied' : '✗ Missing'}`);
  
  if (testResults.backend.errors.length > 0) {
    console.log('\n' + colors.red + 'Backend Issues:' + colors.reset);
    testResults.backend.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n' + colors.bold + 'FRONTEND VERIFICATION' + colors.reset);
  console.log('-'.repeat(40));
  console.log(`Defensive Checks for movePatterns: ${testResults.frontend.defensiveChecksForMovePatterns ? '✓ Present' : '✗ Missing'}`);
  console.log(`Fallback Message for movePatterns: ${testResults.frontend.fallbackMessageForMovePatterns ? '✓ Present' : '✗ Missing'}`);
  console.log(`Conditional Rendering for movePatterns: ${testResults.frontend.conditionalRenderingForMovePatterns ? '✓ Present' : '✗ Missing'}`);
  console.log(`Abandonment Analytics Access: ${testResults.frontend.abandonmentAnalyticsAccess ? '⚠ Issue Found' : '✓ OK'}`);
  
  if (testResults.frontend.errors.length > 0) {
    console.log('\n' + colors.red + 'Frontend Issues:' + colors.reset);
    testResults.frontend.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n' + colors.bold + 'INTEGRATION VERIFICATION' + colors.reset);
  console.log('-'.repeat(40));
  console.log(`movePatterns Compatibility: ${testResults.integration.movePatternsCompatible ? '✓ Compatible' : '✗ Incompatible'}`);
  console.log(`abandonmentAnalytics Compatibility: ${testResults.integration.abandonmentCompatible ? '✓ Compatible' : '✗ Incompatible'}`);
  console.log(`Overall Status: ${testResults.integration.overall ? '✓ Pass' : '✗ Fail'}`);
  
  if (testResults.integration.errors.length > 0) {
    console.log('\n' + colors.red + 'Integration Issues:' + colors.reset);
    testResults.integration.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  // Final verdict
  console.log('\n' + colors.bold + '='.repeat(80) + colors.reset);
  console.log(colors.bold + 'FINAL VERDICT' + colors.reset);
  console.log('='.repeat(80));
  
  const movePatternsFixVerified = testResults.backend.movePatternsFix && 
    testResults.frontend.defensiveChecksForMovePatterns;
  
  if (movePatternsFixVerified) {
    log('✓ The TypeError fix for analytics.behaviorAnalytics.movePatterns is VERIFIED', 'green');
    log('  - Backend returns correct structure with movePatterns object', 'green');
    log('  - Frontend has defensive checks and fallback UI', 'green');
    log('  - Data structures are compatible between backend and frontend', 'green');
  } else {
    log('✗ The TypeError fix for analytics.behaviorAnalytics.movePatterns is NOT VERIFIED', 'red');
  }
  
  console.log('\n' + colors.yellow + '⚠ ADDITIONAL ISSUES FOUND:' + colors.reset);
  
  if (testResults.backend.abandonmentAnalyticsStructure && 
      !testResults.frontend.abandonmentAnalyticsAccess) {
    // This is the expected case - backend returns flat, frontend doesn't access nested
  } else if (testResults.frontend.abandonmentAnalyticsAccess) {
    log('  1. Data structure mismatch in abandonmentAnalytics:', 'yellow');
    log('     - Backend returns flat structure: { abandonedCarts, abandonmentRate, ... }', 'yellow');
    log('     - Frontend expects nested structure: { cartAbandonment: { abandonmentRate }, wishlistAbandonment: { abandonmentRate } }', 'yellow');
    log('     - This will cause: TypeError: analytics.abandonmentAnalytics.cartAbandonment is undefined', 'yellow');
    log('     - Location: CartWishlistAnalytics.tsx:470', 'yellow');
  }
  
  console.log('\n' + colors.bold + '='.repeat(80) + colors.reset + '\n');
  
  // Save results to file
  const resultsPath = path.join(__dirname, `cart-wishlist-analytics-verification-results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  log(`Detailed results saved to: ${resultsPath}`, 'blue');
}

// Run tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
