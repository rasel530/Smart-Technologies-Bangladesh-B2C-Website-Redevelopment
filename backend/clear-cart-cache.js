/**
 * Clear Cart Redis Cache Script
 * 
 * This script clears all cart-related cache entries from Redis to fix
 * stale data issues with cart pricing calculations.
 * 
 * Usage: node backend/clear-cart-cache.js
 */

const { redisConnectionPool } = require('./services/redisConnectionPool');
const { loggerService } = require('./services/logger');

async function clearCartCache() {
  console.log('========================================');
  console.log('🧹 Clearing Cart Redis Cache');
  console.log('========================================\n');

  try {
    // Initialize Redis connection pool
    console.log('1️⃣ Initializing Redis connection...');
    await redisConnectionPool.initialize();
    
    // Get Redis client
    const redis = redisConnectionPool.getClient('clearCartCache');
    
    if (!redis) {
      console.error('❌ Failed to get Redis client');
      process.exit(1);
    }

    // Check Redis connection
    console.log('2️⃣ Checking Redis connection...');
    try {
      await redis.ping();
      console.log('✅ Redis connection successful\n');
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      process.exit(1);
    }

    // Get all cart-related keys
    console.log('3️⃣ Finding cart-related cache keys...');
    const cartKeys = await redis.keys('cart:*');
    console.log(`   Found ${cartKeys.length} cart-related cache entries\n`);

    if (cartKeys.length === 0) {
      console.log('✅ No cart cache entries found. Cache is already clean.\n');
      await redis.quit();
      process.exit(0);
    }

    // Display keys to be deleted
    console.log('4️⃣ Cache keys to be deleted:');
    cartKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    console.log('');

    // Delete all cart keys
    console.log('5️⃣ Deleting cart cache entries...');
    let deletedCount = 0;
    for (const key of cartKeys) {
      try {
        await redis.del(key);
        deletedCount++;
        console.log(`   ✅ Deleted: ${key}`);
      } catch (error) {
        console.log(`   ❌ Failed to delete ${key}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount}/${cartKeys.length} cache entries\n`);

    // Verify cache is cleared
    console.log('6️⃣ Verifying cache is cleared...');
    const remainingKeys = await redis.keys('cart:*');
    if (remainingKeys.length === 0) {
      console.log('✅ All cart cache entries have been cleared\n');
    } else {
      console.warn(`⚠️  Warning: ${remainingKeys.length} entries remain in cache\n`);
    }

    // Close Redis connection
    console.log('7️⃣ Closing Redis connection...');
    try {
      if (typeof redis.quit === 'function') {
        await redis.quit();
      } else if (typeof redis.disconnect === 'function') {
        await redis.disconnect();
      } else if (typeof redis.close === 'function') {
        await redis.close();
      }
      console.log('✅ Redis connection closed\n');
    } catch (error) {
      console.warn('⚠️  Warning: Could not close Redis connection:', error.message);
    }

    console.log('========================================');
    console.log('✅ Cart Cache Clearing Complete!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Restart the backend server if needed');
    console.log('2. Test the cart endpoint to verify correct pricing');
    console.log('3. Verify that Order Summary shows correct subtotal\n');

  } catch (error) {
    console.error('\n❌ Error clearing cart cache:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the cache clearing
clearCartCache();
