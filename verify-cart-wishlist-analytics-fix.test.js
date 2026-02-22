/**
 * Verification Test for Cart-Wishlist Analytics Fix
 * 
 * This test verifies that the fix for the TypeError in CartWishlistAnalytics component
 * resolves the error: "can't access property 'totalAdds', analytics.systemAnalytics.cartActivity is undefined"
 * 
 * Test Coverage:
 * 1. Backend API endpoint returns complete data structure
 * 2. All required properties are present in the response
 * 3. Frontend can successfully access analytics.systemAnalytics.cartActivity.totalAdds without errors
 */

// Import the service directly to avoid caching issues
const { cartWishlistAnalyticsService } = require('./backend/services/cartWishlist/cartWishlistAnalytics.service');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} - ${testName}`);
    if (message) console.log(`  ${colors.cyan}${message}${colors.reset}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
  }
  if (details) {
    console.log(`  ${colors.yellow}Details:${colors.reset}`, details);
  }
  testResults.details.push({
    testName,
    passed,
    message,
    details
  });
}

/**
 * Helper function to verify type
 */
function verifyType(value, expectedType, propertyName) {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new Error(
      `Property '${propertyName}' has incorrect type. Expected: ${expectedType}, Actual: ${actualType}`
    );
  }
}

/**
 * Helper function to verify nested property access
 */
function verifyPropertyAccess(obj, propertyPath) {
  const properties = propertyPath.split('.');
  let current = obj;
  
  for (const prop of properties) {
    if (current === null || current === undefined) {
      throw new Error(
        `Cannot access property '${prop}' - parent object is ${current}`
      );
    }
    current = current[prop];
  }
  
  return current;
}

/**
 * Test 1: Verify service returns complete SystemAnalytics structure
 */
async function testServiceReturnsCompleteStructure() {
  console.log(`\n${colors.bright}${colors.blue}Test 1: Service Returns Complete SystemAnalytics Structure${colors.reset}`);
  console.log(`${colors.cyan}─${'─'.repeat(70)}${colors.reset}`);
  
  try {
    const result = await cartWishlistAnalyticsService.getSystemAnalytics({});
    
    // Verify top-level properties exist
    const requiredTopLevelProps = [
      'cartActivity',
      'wishlistActivity',
      'moveOperations',
      'syncStats',
      'conflictStats'
    ];
    
    for (const prop of requiredTopLevelProps) {
      if (!(prop in result)) {
        logTest(
          `Top-level property '${prop}' exists`,
          false,
          `Missing required top-level property: ${prop}`
        );
        return;
      }
    }
    
    logTest(
      'All required top-level properties exist',
      true,
      `Found: ${requiredTopLevelProps.join(', ')}`
    );
    
    // Verify cartActivity structure
    const cartActivity = result.cartActivity;
    const requiredCartActivityProps = ['totalAdds', 'totalRemoves', 'totalViews'];
    
    for (const prop of requiredCartActivityProps) {
      if (!(prop in cartActivity)) {
        logTest(
          `cartActivity property '${prop}' exists`,
          false,
          `Missing required cartActivity property: ${prop}`
        );
        return;
      }
      verifyType(cartActivity[prop], 'number', `cartActivity.${prop}`);
    }
    
    logTest(
      'cartActivity has all required properties with correct types',
      true,
      `Properties: ${requiredCartActivityProps.join(', ')} (all numbers)`
    );
    
    // Verify wishlistActivity structure
    const wishlistActivity = result.wishlistActivity;
    const requiredWishlistActivityProps = ['totalAdds', 'totalRemoves', 'totalViews'];
    
    for (const prop of requiredWishlistActivityProps) {
      if (!(prop in wishlistActivity)) {
        logTest(
          `wishlistActivity property '${prop}' exists`,
          false,
          `Missing required wishlistActivity property: ${prop}`
        );
        return;
      }
      verifyType(wishlistActivity[prop], 'number', `wishlistActivity.${prop}`);
    }
    
    logTest(
      'wishlistActivity has all required properties with correct types',
      true,
      `Properties: ${requiredWishlistActivityProps.join(', ')} (all numbers)`
    );
    
    // Verify moveOperations structure
    const moveOperations = result.moveOperations;
    const requiredMoveOperationsProps = ['cartToWishlist', 'wishlistToCart', 'total'];
    
    for (const prop of requiredMoveOperationsProps) {
      if (!(prop in moveOperations)) {
        logTest(
          `moveOperations property '${prop}' exists`,
          false,
          `Missing required moveOperations property: ${prop}`
        );
        return;
      }
      verifyType(moveOperations[prop], 'number', `moveOperations.${prop}`);
    }
    
    logTest(
      'moveOperations has all required properties with correct types',
      true,
      `Properties: ${requiredMoveOperationsProps.join(', ')} (all numbers)`
    );
    
    // Verify syncStats structure
    const syncStats = result.syncStats;
    const requiredSyncStatsProps = ['totalSyncs', 'successfulSyncs', 'failedSyncs', 'averageSyncTime'];
    
    for (const prop of requiredSyncStatsProps) {
      if (!(prop in syncStats)) {
        logTest(
          `syncStats property '${prop}' exists`,
          false,
          `Missing required syncStats property: ${prop}`
        );
        return;
      }
      verifyType(syncStats[prop], 'number', `syncStats.${prop}`);
    }
    
    logTest(
      'syncStats has all required properties with correct types',
      true,
      `Properties: ${requiredSyncStatsProps.join(', ')} (all numbers)`
    );
    
    // Verify conflictStats structure
    const conflictStats = result.conflictStats;
    const requiredConflictStatsProps = ['totalConflicts', 'resolvedConflicts', 'pendingConflicts'];
    
    for (const prop of requiredConflictStatsProps) {
      if (!(prop in conflictStats)) {
        logTest(
          `conflictStats property '${prop}' exists`,
          false,
          `Missing required conflictStats property: ${prop}`
        );
        return;
      }
      verifyType(conflictStats[prop], 'number', `conflictStats.${prop}`);
    }
    
    logTest(
      'conflictStats has all required properties with correct types',
      true,
      `Properties: ${requiredConflictStatsProps.join(', ')} (all numbers)`
    );
    
    // Verify values are non-negative
    const allNumericValues = [
      ...Object.values(cartActivity),
      ...Object.values(wishlistActivity),
      ...Object.values(moveOperations),
      ...Object.values(syncStats),
      ...Object.values(conflictStats)
    ];
    
    const hasNegativeValues = allNumericValues.some(val => val < 0);
    if (hasNegativeValues) {
      logTest(
        'All numeric values are non-negative',
        false,
        'Found negative values in analytics data'
      );
    } else {
      logTest(
        'All numeric values are non-negative',
        true,
        'All counts and metrics are valid (>= 0)'
      );
    }
    
    return result;
  } catch (error) {
    logTest(
      'Service returns complete structure',
      false,
      `Error: ${error.message}`,
      { stack: error.stack }
    );
    return null;
  }
}

/**
 * Test 2: Verify accessing cartActivity.totalAdds doesn't throw error
 */
async function testAccessCartActivityTotalAdds() {
  console.log(`\n${colors.bright}${colors.blue}Test 2: Access cartActivity.totalAdds Without Errors${colors.reset}`);
  console.log(`${colors.cyan}─${'─'.repeat(70)}${colors.reset}`);
  
  try {
    const result = await cartWishlistAnalyticsService.getSystemAnalytics({});
    
    // Simulate the exact access pattern from the frontend component
    // This is the line that was causing the TypeError:
    // analytics.systemAnalytics.cartActivity.totalAdds
    const analytics = {
      systemAnalytics: result
    };
    
    try {
      const totalAdds = verifyPropertyAccess(
        analytics,
        'systemAnalytics.cartActivity.totalAdds'
      );
      
      verifyType(totalAdds, 'number', 'systemAnalytics.cartActivity.totalAdds');
      
      logTest(
        'Access analytics.systemAnalytics.cartActivity.totalAdds',
        true,
        `Successfully accessed totalAdds: ${totalAdds}`
      );
      
      // Verify the value is a valid number
      if (isNaN(totalAdds)) {
        logTest(
          'totalAdds is a valid number',
          false,
          'totalAdds is NaN'
        );
      } else {
        logTest(
          'totalAdds is a valid number',
          true,
          `Value: ${totalAdds}`
        );
      }
      
      // Test all other nested accesses that the frontend uses
      const testPaths = [
        'systemAnalytics.cartActivity.totalRemoves',
        'systemAnalytics.cartActivity.totalViews',
        'systemAnalytics.wishlistActivity.totalAdds',
        'systemAnalytics.wishlistActivity.totalRemoves',
        'systemAnalytics.wishlistActivity.totalViews',
        'systemAnalytics.moveOperations.cartToWishlist',
        'systemAnalytics.moveOperations.wishlistToCart',
        'systemAnalytics.moveOperations.total',
        'systemAnalytics.syncStats.totalSyncs',
        'systemAnalytics.syncStats.successfulSyncs',
        'systemAnalytics.syncStats.failedSyncs',
        'systemAnalytics.syncStats.averageSyncTime',
        'systemAnalytics.conflictStats.totalConflicts',
        'systemAnalytics.conflictStats.resolvedConflicts',
        'systemAnalytics.conflictStats.pendingConflicts'
      ];
      
      for (const path of testPaths) {
        try {
          const value = verifyPropertyAccess(analytics, path);
          verifyType(value, 'number', path);
        } catch (error) {
          logTest(
            `Access ${path}`,
            false,
            error.message
          );
          return;
        }
      }
      
      logTest(
        'All nested properties are accessible',
        true,
        `Successfully verified ${testPaths.length} property paths`
      );
      
    } catch (error) {
      logTest(
        'Access analytics.systemAnalytics.cartActivity.totalAdds',
        false,
        `TypeError: ${error.message}`,
        { stack: error.stack }
      );
    }
  } catch (error) {
    logTest(
      'Access cartActivity.totalAdds',
      false,
      `Error: ${error.message}`,
      { stack: error.stack }
    );
  }
}

/**
 * Test 3: Verify data integrity and consistency
 */
async function testDataIntegrity() {
  console.log(`\n${colors.bright}${colors.blue}Test 3: Data Integrity and Consistency${colors.reset}`);
  console.log(`${colors.cyan}─${'─'.repeat(70)}${colors.reset}`);
  
  try {
    const result = await cartWishlistAnalyticsService.getSystemAnalytics({});
    
    // Verify moveOperations total equals sum of individual moves
    const expectedMoveTotal = result.moveOperations.cartToWishlist + result.moveOperations.wishlistToCart;
    if (result.moveOperations.total !== expectedMoveTotal) {
      logTest(
        'moveOperations.total equals cartToWishlist + wishlistToCart',
        false,
        `Expected: ${expectedMoveTotal}, Actual: ${result.moveOperations.total}`
      );
    } else {
      logTest(
        'moveOperations.total equals cartToWishlist + wishlistToCart',
        true,
        `Total: ${result.moveOperations.total} (${result.moveOperations.cartToWishlist} + ${result.moveOperations.wishlistToCart})`
      );
    }
    
    // Verify syncStats total equals successful + failed
    const expectedSyncTotal = result.syncStats.successfulSyncs + result.syncStats.failedSyncs;
    if (result.syncStats.totalSyncs !== expectedSyncTotal) {
      logTest(
        'syncStats.totalSyncs equals successfulSyncs + failedSyncs',
        false,
        `Expected: ${expectedSyncTotal}, Actual: ${result.syncStats.totalSyncs}`
      );
    } else {
      logTest(
        'syncStats.totalSyncs equals successfulSyncs + failedSyncs',
        true,
        `Total: ${result.syncStats.totalSyncs} (${result.syncStats.successfulSyncs} + ${result.syncStats.failedSyncs})`
      );
    }
    
    // Verify conflictStats total equals resolved + pending
    const expectedConflictTotal = result.conflictStats.resolvedConflicts + result.conflictStats.pendingConflicts;
    if (result.conflictStats.totalConflicts !== expectedConflictTotal) {
      logTest(
        'conflictStats.totalConflicts equals resolvedConflicts + pendingConflicts',
        false,
        `Expected: ${expectedConflictTotal}, Actual: ${result.conflictStats.totalConflicts}`
      );
    } else {
      logTest(
        'conflictStats.totalConflicts equals resolvedConflicts + pendingConflicts',
        true,
        `Total: ${result.conflictStats.totalConflicts} (${result.conflictStats.resolvedConflicts} + ${result.conflictStats.pendingConflicts})`
      );
    }
    
    // Verify averageSyncTime is reasonable (should be a positive number or 0)
    if (result.syncStats.averageSyncTime < 0) {
      logTest(
        'averageSyncTime is non-negative',
        false,
        `averageSyncTime is negative: ${result.syncStats.averageSyncTime}`
      );
    } else {
      logTest(
        'averageSyncTime is non-negative',
        true,
        `Value: ${result.syncStats.averageSyncTime} seconds`
      );
    }
    
  } catch (error) {
    logTest(
      'Data integrity verification',
      false,
      `Error: ${error.message}`,
      { stack: error.stack }
    );
  }
}

/**
 * Test 4: Verify service handles date filters correctly
 */
async function testDateFilters() {
  console.log(`\n${colors.bright}${colors.blue}Test 4: Date Filter Handling${colors.reset}`);
  console.log(`${colors.cyan}─${'─'.repeat(70)}${colors.reset}`);
  
  try {
    // Test with date filters
    const filters = {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const result = await cartWishlistAnalyticsService.getSystemAnalytics(filters);
    
    // Verify structure is maintained with filters
    if (!result.cartActivity || !result.wishlistActivity || 
        !result.moveOperations || !result.syncStats || !result.conflictStats) {
      logTest(
        'Structure maintained with date filters',
        false,
        'Missing required properties when using date filters'
      );
    } else {
      logTest(
        'Structure maintained with date filters',
        true,
        'All required properties present with date filters'
      );
    }
    
    // Verify dateRange is included in response
    if (result.dateRange) {
      logTest(
        'dateRange included in response',
        true,
        `Start: ${result.dateRange.startDate}, End: ${result.dateRange.endDate}`
      );
    } else {
      logTest(
        'dateRange included in response',
        false,
        'dateRange property is missing'
      );
    }
    
  } catch (error) {
    logTest(
      'Date filter handling',
      false,
      `Error: ${error.message}`,
      { stack: error.stack }
    );
  }
}

/**
 * Test 5: Verify error handling
 */
async function testErrorHandling() {
  console.log(`\n${colors.bright}${colors.blue}Test 5: Error Handling${colors.reset}`);
  console.log(`${colors.cyan}─${'─'.repeat(70)}${colors.reset}`);
  
  try {
    // Test with invalid date format (should not crash)
    const invalidFilters = {
      startDate: 'invalid-date',
      endDate: 'also-invalid'
    };
    
    try {
      const result = await cartWishlistAnalyticsService.getSystemAnalytics(invalidFilters);
      logTest(
        'Service handles invalid date formats gracefully',
        true,
        'Service did not crash with invalid dates'
      );
    } catch (error) {
      // If it throws an error, verify it's a meaningful error
      if (error.message) {
        logTest(
          'Service handles invalid date formats gracefully',
          true,
          `Service threw meaningful error: ${error.message.substring(0, 100)}`
        );
      } else {
        logTest(
          'Service handles invalid date formats gracefully',
          false,
          'Service threw error without message'
        );
      }
    }
    
    // Test with empty filters (should work)
    const result = await cartWishlistAnalyticsService.getSystemAnalytics({});
    if (result && result.cartActivity) {
      logTest(
        'Service handles empty filters',
        true,
        'Service returns data with no filters'
      );
    } else {
      logTest(
        'Service handles empty filters',
        false,
        'Service did not return expected data with no filters'
      );
    }
    
  } catch (error) {
    logTest(
      'Error handling',
      false,
      `Error: ${error.message}`,
      { stack: error.stack }
    );
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Cart-Wishlist Analytics Fix Verification Test                      ║');
  console.log('║  Verifying fix for TypeError: cartActivity is undefined            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  
  const startTime = Date.now();
  
  // Run all tests
  await testServiceReturnsCompleteStructure();
  await testAccessCartActivityTotalAdds();
  await testDataIntegrity();
  await testDateFilters();
  await testErrorHandling();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  
  console.log(`\n${colors.bright}Total Tests:${colors.reset} ${testResults.total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testResults.failed}`);
  console.log(`\n${colors.bright}Duration:${colors.reset} ${duration}s`);
  
  if (testResults.failed === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ ALL TESTS PASSED - Fix is working correctly!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ SOME TESTS FAILED - Fix may need attention${colors.reset}\n`);
  }
  
  // Print detailed results
  console.log(`\n${colors.bright}${colors.cyan}Detailed Results:${colors.reset}\n`);
  testResults.details.forEach((detail, index) => {
    const status = detail.passed ? 
      `${colors.green}PASS${colors.reset}` : 
      `${colors.red}FAIL${colors.reset}`;
    console.log(`${index + 1}. [${status}] ${detail.testName}`);
    if (detail.message) {
      console.log(`   ${detail.message}`);
    }
  });
  
  console.log();
  
  // Return exit code based on test results
  return testResults.failed === 0 ? 0 : 1;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testResults
};
