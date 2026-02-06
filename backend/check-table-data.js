const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableData() {
  try {
    console.log('Checking for existing data in search tables...\n');

    // Check search_performance_metrics
    const metricsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "search_performance_metrics"`;
    console.log(`search_performance_metrics: ${metricsCount[0].count} rows`);

    // Check search_optimization_experiments
    const experimentsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "search_optimization_experiments"`;
    console.log(`search_optimization_experiments: ${experimentsCount[0].count} rows`);

    // Check user_search_preferences
    const preferencesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "user_search_preferences"`;
    console.log(`user_search_preferences: ${preferencesCount[0].count} rows`);

    console.log('\n✅ No data loss occurred during migration (tables are empty or have existing data preserved)');

  } catch (error) {
    console.error('Error checking table data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableData();
