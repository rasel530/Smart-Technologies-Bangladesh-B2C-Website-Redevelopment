/**
 * Cart-Wishlist Analytics Verification Test
 * 
 * This test verifies that backend analytics endpoints return correct
 * data structure expected by frontend.
 * 
 * Task: Verify fix for TypeError - conversionAnalytics.funnel
 * 
 * Expected Outcome:
 * - Backend API returns correct data structure
 * - Frontend can access data without throwing TypeError
 * - Charts display properly with the new data
 */

const { cartWishlistAnalyticsService } = require('./services/cartWishlist/cartWishlistAnalytics.service');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message, details = null) {
  const result = {
    test: testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    testResults.summary.failed++;
    console.log(`✗ FAIL: ${testName}`);
  }
  
  if (message) {
    console.log(`  ${message}`);
  }
  
  if (details) {
    console.log(`  Details:`, JSON.stringify(details, null, 2));
  }
  
  console.log('');
}

/**
 * Test 1: Verify getConversionAnalytics returns correct structure
 */
async function testConversionAnalytics() {
  console.log('=== Test 1: Conversion Analytics ===\n');
  
  try {
    const result = await cartWishlistAnalyticsService.getConversionAnalytics();
    
    // Check if result exists
    logTest(
      'Conversion Analytics - Result exists',
      !!result,
      result ? 'Result object exists' : 'No result returned'
    );
    
    // Check funnel structure
    const hasFunnel = result && result.funnel && typeof result.funnel === 'object';
    logTest(
      'Conversion Analytics - Has funnel object',
      hasFunnel,
      hasFunnel ? 'funnel object exists' : 'funnel object missing or invalid'
    );
    
    if (hasFunnel) {
      const funnel = result.funnel;
      const requiredFields = ['views', 'cartAdds', 'wishlistAdds', 'cartToWishlistMoves', 'wishlistToCartMoves', 'checkouts'];
      
      for (const field of requiredFields) {
        logTest(
          `Conversion Analytics - funnel.${field} exists`,
          funnel.hasOwnProperty(field),
          funnel.hasOwnProperty(field) ? `funnel.${field} exists` : `funnel.${field} missing`
        );
      }
    }
    
    // Check conversionRates structure
    const hasConversionRates = result && result.conversionRates && typeof result.conversionRates === 'object';
    logTest(
      'Conversion Analytics - Has conversionRates object',
      hasConversionRates,
      hasConversionRates ? 'conversionRates object exists' : 'conversionRates object missing or invalid'
    );
    
    if (hasConversionRates) {
      const conversionRates = result.conversionRates;
      const requiredFields = ['viewToCart', 'viewToWishlist', 'cartToCheckout', 'wishlistToCart', 'wishlistToCheckout'];
      
      for (const field of requiredFields) {
        logTest(
          `Conversion Analytics - conversionRates.${field} exists`,
          conversionRates.hasOwnProperty(field),
          conversionRates.hasOwnProperty(field) ? `conversionRates.${field} exists` : `conversionRates.${field} missing`
        );
      }
    }
    
    // Check topConvertedProducts structure
    const hasTopConvertedProducts = result && Array.isArray(result.topConvertedProducts);
    logTest(
      'Conversion Analytics - Has topConvertedProducts array',
      hasTopConvertedProducts,
      hasTopConvertedProducts ? 'topConvertedProducts array exists' : 'topConvertedProducts missing or not an array'
    );
    
    // Verify complete expected structure
    const expectedStructure = {
      funnel: {
        views: 'number',
        cartAdds: 'number',
        wishlistAdds: 'number',
        cartToWishlistMoves: 'number',
        wishlistToCartMoves: 'number',
        checkouts: 'number'
      },
      conversionRates: {
        viewToCart: 'number',
        viewToWishlist: 'number',
        cartToCheckout: 'number',
        wishlistToCart: 'number',
        wishlistToCheckout: 'number'
      },
      topConvertedProducts: 'array'
    };
    
    let structureMatch = true;
    const structureErrors = [];
    
    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      if (expectedType === 'array') {
        if (!Array.isArray(result[key])) {
          structureMatch = false;
          structureErrors.push(`${key} should be an array but is ${typeof result[key]}`);
        }
      } else if (typeof expectedType === 'object') {
        if (!result[key] || typeof result[key] !== 'object') {
          structureMatch = false;
          structureErrors.push(`${key} should be an object but is ${typeof result[key]}`);
        } else {
          for (const [subKey, subType] of Object.entries(expectedType)) {
            if (typeof result[key][subKey] !== subType) {
              structureMatch = false;
              structureErrors.push(`${key}.${subKey} should be ${subType} but is ${typeof result[key][subKey]}`);
            }
          }
        }
      }
    }
    
    logTest(
      'Conversion Analytics - Complete structure matches expected',
      structureMatch,
      structureMatch ? 'Structure matches expected format' : 'Structure does not match expected format',
      structureErrors.length > 0 ? { errors: structureErrors } : null
    );
    
    return result;
  } catch (error) {
    logTest(
      'Conversion Analytics - No errors thrown',
      false,
      `Error thrown: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    return null;
  }
}

/**
 * Test 2: Verify getAbandonmentAnalytics returns correct structure
 */
async function testAbandonmentAnalytics() {
  console.log('=== Test 2: Abandonment Analytics ===\n');
  
  try {
    const result = await cartWishlistAnalyticsService.getAbandonmentAnalytics();
    
    // Check if result exists
    logTest(
      'Abandonment Analytics - Result exists',
      !!result,
      result ? 'Result object exists' : 'No result returned'
    );
    
    // Frontend expects nested structure with cartAbandonment and wishlistAbandonment
    const hasCartAbandonment = result && result.cartAbandonment && typeof result.cartAbandonment === 'object';
    logTest(
      'Abandonment Analytics - Has cartAbandonment object (FRONTEND EXPECTED)',
      hasCartAbandonment,
      hasCartAbandonment ? 'cartAbandonment object exists' : 'cartAbandonment object missing - THIS WILL CAUSE FRONTEND ERROR',
      { actualStructure: Object.keys(result || {}) }
    );
    
    const hasWishlistAbandonment = result && result.wishlistAbandonment && typeof result.wishlistAbandonment === 'object';
    logTest(
      'Abandonment Analytics - Has wishlistAbandonment object (FRONTEND EXPECTED)',
      hasWishlistAbandonment,
      hasWishlistAbandonment ? 'wishlistAbandonment object exists' : 'wishlistAbandonment object missing - THIS WILL CAUSE FRONTEND ERROR',
      { actualStructure: Object.keys(result || {}) }
    );
    
    // Check what backend actually returns
    const hasAbandonedCarts = result && result.hasOwnProperty('abandonedCarts');
    logTest(
      'Abandonment Analytics - Has abandonedCarts (BACKEND ACTUAL)',
      hasAbandonedCarts,
      hasAbandonedCarts ? 'abandonedCarts exists' : 'abandonedCarts missing'
    );
    
    const hasAbandonmentRate = result && result.hasOwnProperty('abandonmentRate');
    logTest(
      'Abandonment Analytics - Has abandonmentRate (BACKEND ACTUAL)',
      hasAbandonmentRate,
      hasAbandonmentRate ? 'abandonmentRate exists' : 'abandonmentRate missing'
    );
    
    // Check for abandonmentTrend
    const hasAbandonmentTrend = result && Array.isArray(result.abandonmentTrend);
    logTest(
      'Abandonment Analytics - Has abandonmentTrend array (FRONTEND EXPECTED)',
      hasAbandonmentTrend,
      hasAbandonmentTrend ? 'abandonmentTrend array exists' : 'abandonmentTrend missing or not an array'
    );
    
    // Check for topAbandonedProducts
    const hasTopAbandonedProducts = result && Array.isArray(result.topAbandonedProducts);
    logTest(
      'Abandonment Analytics - Has topAbandonedProducts array (FRONTEND EXPECTED)',
      hasTopAbandonedProducts,
      hasTopAbandonedProducts ? 'topAbandonedProducts array exists' : 'topAbandonedProducts missing or not an array'
    );
    
    // Verify expected frontend structure
    const expectedStructure = {
      cartAbandonment: {
        totalAbandoned: 'number',
        abandonmentRate: 'number',
        averageTimeBeforeAbandon: 'number'
      },
      wishlistAbandonment: {
        totalAbandoned: 'number',
        abandonmentRate: 'number',
        averageTimeBeforeAbandon: 'number'
      },
      abandonmentTrend: 'array',
      topAbandonedProducts: 'array'
    };
    
    let structureMatch = true;
    const structureErrors = [];
    
    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      if (expectedType === 'array') {
        if (!Array.isArray(result[key])) {
          structureMatch = false;
          structureErrors.push(`${key} should be an array but is ${typeof result[key]}`);
        }
      } else if (typeof expectedType === 'object') {
        if (!result[key] || typeof result[key] !== 'object') {
          structureMatch = false;
          structureErrors.push(`${key} should be an object but is ${typeof result[key]}`);
        } else {
          for (const [subKey, subType] of Object.entries(expectedType)) {
            if (typeof result[key][subKey] !== subType) {
              structureMatch = false;
              structureErrors.push(`${key}.${subKey} should be ${subType} but is ${typeof result[key][subKey]}`);
            }
          }
        }
      }
    }
    
    logTest(
      'Abandonment Analytics - Complete structure matches frontend expected',
      structureMatch,
      structureMatch ? 'Structure matches expected format' : 'CRITICAL: Structure does not match frontend expected format - THIS WILL CAUSE TYPEERROR',
      structureErrors.length > 0 ? { errors: structureErrors, actualStructure: Object.keys(result || {}) } : null
    );
    
    return result;
  } catch (error) {
    logTest(
      'Abandonment Analytics - No errors thrown',
      false,
      `Error thrown: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    return null;
  }
}

/**
 * Test 3: Verify getBehaviorAnalytics returns correct structure
 */
async function testBehaviorAnalytics() {
  console.log('=== Test 3: Behavior Analytics ===\n');
  
  try {
    const result = await cartWishlistAnalyticsService.getBehaviorAnalytics();
    
    // Check if result exists
    logTest(
      'Behavior Analytics - Result exists',
      !!result,
      result ? 'Result object exists' : 'No result returned'
    );
    
    // Check userBehavior structure
    const hasUserBehavior = result && Array.isArray(result.userBehavior);
    logTest(
      'Behavior Analytics - Has userBehavior array',
      hasUserBehavior,
      hasUserBehavior ? 'userBehavior array exists' : 'userBehavior missing or not an array'
    );
    
    // Check timeInCart structure
    const hasTimeInCart = result && result.timeInCart && typeof result.timeInCart === 'object';
    logTest(
      'Behavior Analytics - Has timeInCart object',
      hasTimeInCart,
      hasTimeInCart ? 'timeInCart object exists' : 'timeInCart object missing or invalid'
    );
    
    if (hasTimeInCart) {
      const timeInCart = result.timeInCart;
      const requiredFields = ['average', 'median', 'max'];
      
      for (const field of requiredFields) {
        logTest(
          `Behavior Analytics - timeInCart.${field} exists`,
          timeInCart.hasOwnProperty(field),
          timeInCart.hasOwnProperty(field) ? `timeInCart.${field} exists` : `timeInCart.${field} missing`
        );
      }
    }
    
    // Check timeInWishlist structure
    const hasTimeInWishlist = result && result.timeInWishlist && typeof result.timeInWishlist === 'object';
    logTest(
      'Behavior Analytics - Has timeInWishlist object',
      hasTimeInWishlist,
      hasTimeInWishlist ? 'timeInWishlist object exists' : 'timeInWishlist object missing or invalid'
    );
    
    if (hasTimeInWishlist) {
      const timeInWishlist = result.timeInWishlist;
      const requiredFields = ['average', 'median', 'max'];
      
      for (const field of requiredFields) {
        logTest(
          `Behavior Analytics - timeInWishlist.${field} exists`,
          timeInWishlist.hasOwnProperty(field),
          timeInWishlist.hasOwnProperty(field) ? `timeInWishlist.${field} exists` : `timeInWishlist.${field} missing`
        );
      }
    }
    
    // Check movePatterns structure
    const hasMovePatterns = result && result.movePatterns && typeof result.movePatterns === 'object';
    logTest(
      'Behavior Analytics - Has movePatterns object',
      hasMovePatterns,
      hasMovePatterns ? 'movePatterns object exists' : 'movePatterns object missing or invalid'
    );
    
    if (hasMovePatterns) {
      const movePatterns = result.movePatterns;
      const requiredFields = ['cartToWishlist', 'wishlistToCart', 'cartToWishlistToCart'];
      
      for (const field of requiredFields) {
        logTest(
          `Behavior Analytics - movePatterns.${field} exists`,
          movePatterns.hasOwnProperty(field),
          movePatterns.hasOwnProperty(field) ? `movePatterns.${field} exists` : `movePatterns.${field} missing`
        );
      }
    }
    
    return result;
  } catch (error) {
    logTest(
      'Behavior Analytics - No errors thrown',
      false,
      `Error thrown: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    return null;
  }
}

/**
 * Test 4: Verify getSystemAnalytics returns correct structure
 */
async function testSystemAnalytics() {
  console.log('=== Test 4: System Analytics ===\n');
  
  try {
    const result = await cartWishlistAnalyticsService.getSystemAnalytics();
    
    // Check if result exists
    logTest(
      'System Analytics - Result exists',
      !!result,
      result ? 'Result object exists' : 'No result returned'
    );
    
    // Check cartActivity structure
    const hasCartActivity = result && result.cartActivity && typeof result.cartActivity === 'object';
    logTest(
      'System Analytics - Has cartActivity object',
      hasCartActivity,
      hasCartActivity ? 'cartActivity object exists' : 'cartActivity object missing or invalid'
    );
    
    // Check wishlistActivity structure
    const hasWishlistActivity = result && result.wishlistActivity && typeof result.wishlistActivity === 'object';
    logTest(
      'System Analytics - Has wishlistActivity object',
      hasWishlistActivity,
      hasWishlistActivity ? 'wishlistActivity object exists' : 'wishlistActivity object missing or invalid'
    );
    
    // Check moveOperations structure
    const hasMoveOperations = result && result.moveOperations && typeof result.moveOperations === 'object';
    logTest(
      'System Analytics - Has moveOperations object',
      hasMoveOperations,
      hasMoveOperations ? 'moveOperations object exists' : 'moveOperations object missing or invalid'
    );
    
    // Check syncStats structure
    const hasSyncStats = result && result.syncStats && typeof result.syncStats === 'object';
    logTest(
      'System Analytics - Has syncStats object',
      hasSyncStats,
      hasSyncStats ? 'syncStats object exists' : 'syncStats object missing or invalid'
    );
    
    // Check conflictStats structure
    const hasConflictStats = result && result.conflictStats && typeof result.conflictStats === 'object';
    logTest(
      'System Analytics - Has conflictStats object',
      hasConflictStats,
      hasConflictStats ? 'conflictStats object exists' : 'conflictStats object missing or invalid'
    );
    
    return result;
  } catch (error) {
    logTest(
      'System Analytics - No errors thrown',
      false,
      `Error thrown: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    return null;
  }
}

/**
 * Test 5: Verify getPerformanceMetrics returns correct structure
 */
async function testPerformanceMetrics() {
  console.log('=== Test 5: Performance Metrics ===\n');
  
  try {
    const result = await cartWishlistAnalyticsService.getPerformanceMetrics();
    
    // Check if result exists
    logTest(
      'Performance Metrics - Result exists',
      !!result,
      result ? 'Result object exists' : 'No result returned'
    );
    
    // Check averageSyncTime
    const hasAverageSyncTime = result && result.hasOwnProperty('averageSyncTime');
    logTest(
      'Performance Metrics - Has averageSyncTime',
      hasAverageSyncTime,
      hasAverageSyncTime ? 'averageSyncTime exists' : 'averageSyncTime missing'
    );
    
    // Check failedSyncs
    const hasFailedSyncs = result && result.hasOwnProperty('failedSyncs');
    logTest(
      'Performance Metrics - Has failedSyncs',
      hasFailedSyncs,
      hasFailedSyncs ? 'failedSyncs exists' : 'failedSyncs missing'
    );
    
    // Check successfulMoves
    const hasSuccessfulMoves = result && result.hasOwnProperty('successfulMoves');
    logTest(
      'Performance Metrics - Has successfulMoves',
      hasSuccessfulMoves,
      hasSuccessfulMoves ? 'successfulMoves exists' : 'successfulMoves missing'
    );
    
    // Check failedMoves
    const hasFailedMoves = result && result.hasOwnProperty('failedMoves');
    logTest(
      'Performance Metrics - Has failedMoves',
      hasFailedMoves,
      hasFailedMoves ? 'failedMoves exists' : 'failedMoves missing'
    );
    
    return result;
  } catch (error) {
    logTest(
      'Performance Metrics - No errors thrown',
      false,
      `Error thrown: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    return null;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('CART-WISHLIST ANALYTICS VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // Run all tests
    await testConversionAnalytics();
    await testAbandonmentAnalytics();
    await testBehaviorAnalytics();
    await testSystemAnalytics();
    await testPerformanceMetrics();
    
    // Print summary
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Warnings: ${testResults.summary.warnings}`);
    console.log('');
    
    // Save results to file
    const fs = require('fs');
    const resultsPath = `cart-wishlist-analytics-verification-results-${Date.now()}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`Detailed results saved to: ${resultsPath}`);
    
    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('FATAL ERROR running tests:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
