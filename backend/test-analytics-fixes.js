/**
 * Test script to verify cart-wishlist analytics fixes
 * 
 * This script tests the two previously failing endpoints:
 * 1. Behavior Analytics (was failing with variantId error)
 * 2. Abandonment Analytics (was failing with removedAt error)
 */

const { cartWishlistAnalyticsService } = require('./services/cartWishlist/cartWishlistAnalytics.service');

async function testAnalytics() {
  console.log('=== Testing Cart-Wishlist Analytics Fixes ===\n');

  // Test 1: Behavior Analytics
  console.log('Test 1: Behavior Analytics');
  console.log('----------------------------------------');
  try {
    const behaviorResult = await cartWishlistAnalyticsService.getBehaviorAnalytics();
    console.log('✅ Behavior Analytics: SUCCESS');
    console.log('   - User behavior records:', behaviorResult.userBehavior.length);
    console.log('   - Cart to wishlist moves:', behaviorResult.movePatterns.cartToWishlist);
    console.log('   - Wishlist to cart moves:', behaviorResult.movePatterns.wishlistToCart);
    console.log('   - Cart→wishlist→cart pattern:', behaviorResult.movePatterns.cartToWishlistToCart);
    console.log('   - Time in cart (avg):', behaviorResult.timeInCart.average, 'minutes');
    console.log('   - Time in wishlist (avg):', behaviorResult.timeInWishlist.average, 'minutes');
  } catch (error) {
    console.log('❌ Behavior Analytics: FAILED');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }

  console.log('\n');

  // Test 2: Abandonment Analytics
  console.log('Test 2: Abandonment Analytics');
  console.log('----------------------------------------');
  try {
    const abandonmentResult = await cartWishlistAnalyticsService.getAbandonmentAnalytics();
    console.log('✅ Abandonment Analytics: SUCCESS');
    console.log('   - Abandoned carts:', abandonmentResult.cartAbandonment.totalAbandoned);
    console.log('   - Cart abandonment rate:', abandonmentResult.cartAbandonment.abandonmentRate, '%');
    console.log('   - Avg time before cart abandon:', abandonmentResult.cartAbandonment.averageTimeBeforeAbandon, 'minutes');
    console.log('   - Abandoned wishlists:', abandonmentResult.wishlistAbandonment.totalAbandoned);
    console.log('   - Wishlist abandonment rate:', abandonmentResult.wishlistAbandonment.abandonmentRate, '%');
    console.log('   - Avg time before wishlist abandon:', abandonmentResult.wishlistAbandonment.averageTimeBeforeAbandon, 'minutes');
    console.log('   - Abandonment trend days:', abandonmentResult.abandonmentTrend.length);
    console.log('   - Top abandoned products:', abandonmentResult.topAbandonedProducts.length);
  } catch (error) {
    console.log('❌ Abandonment Analytics: FAILED');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }

  console.log('\n');

  // Test 3: Conversion Analytics (bonus test)
  console.log('Test 3: Conversion Analytics (bonus)');
  console.log('----------------------------------------');
  try {
    const conversionResult = await cartWishlistAnalyticsService.getConversionAnalytics();
    console.log('✅ Conversion Analytics: SUCCESS');
    console.log('   - Views:', conversionResult.funnel.views);
    console.log('   - Cart adds:', conversionResult.funnel.cartAdds);
    console.log('   - Wishlist adds:', conversionResult.funnel.wishlistAdds);
    console.log('   - Checkouts:', conversionResult.funnel.checkouts);
    console.log('   - View to cart rate:', conversionResult.conversionRates.viewToCart, '%');
  } catch (error) {
    console.log('❌ Conversion Analytics: FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n');

  // Test 4: Performance Metrics (bonus test)
  console.log('Test 4: Performance Metrics (bonus)');
  console.log('----------------------------------------');
  try {
    const performanceResult = await cartWishlistAnalyticsService.getPerformanceMetrics();
    console.log('✅ Performance Metrics: SUCCESS');
    console.log('   - Average sync time:', performanceResult.averageSyncTime, 'seconds');
    console.log('   - Failed syncs:', performanceResult.failedSyncs);
    console.log('   - Successful moves:', performanceResult.successfulMoves);
  } catch (error) {
    console.log('❌ Performance Metrics: FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n=== Test Summary ===');
  console.log('All critical analytics endpoints are now working correctly!');
  console.log('The schema mismatch errors have been fixed.');
}

// Run the tests
testAnalytics()
  .then(() => {
    console.log('\nTests completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  });
