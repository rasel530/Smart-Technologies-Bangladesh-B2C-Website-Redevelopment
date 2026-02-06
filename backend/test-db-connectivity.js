const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnectivity() {
  try {
    console.log('Testing database connectivity...\n');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test query on search_performance_metrics
    const metricsCount = await prisma.searchPerformanceMetrics.count();
    console.log(`✅ search_performance_metrics table accessible (${metricsCount} rows)`);

    // Test query on search_optimization_experiments
    const experimentsCount = await prisma.searchOptimizationExperiments.count();
    console.log(`✅ search_optimization_experiments table accessible (${experimentsCount} rows)`);

    // Test query on user_search_preferences
    const preferencesCount = await prisma.userSearchPreferences.count();
    console.log(`✅ user_search_preferences table accessible (${preferencesCount} rows)`);

    // Test search_analytics table
    const analyticsCount = await prisma.searchAnalytics.count();
    console.log(`✅ search_analytics table accessible (${analyticsCount} rows)`);

    // Test search_trending table
    const trendingCount = await prisma.searchTrending.count();
    console.log(`✅ search_trending table accessible (${trendingCount} rows)`);

    // Test search_recommendations table
    const recommendationsCount = await prisma.searchRecommendations.count();
    console.log(`✅ search_recommendations table accessible (${recommendationsCount} rows)`);

    // Test search_click_tracking table
    const trackingCount = await prisma.searchClickTracking.count();
    console.log(`✅ search_click_tracking table accessible (${trackingCount} rows)`);

    console.log('\n=== DATABASE CONNECTIVITY TEST PASSED ===');
    console.log('All search analytics tables are accessible and operational.');

  } catch (error) {
    console.error('❌ Database connectivity test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnectivity();
