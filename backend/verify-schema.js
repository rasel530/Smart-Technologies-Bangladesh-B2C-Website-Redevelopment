const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log('Verifying database schema...\n');

    // Check search_performance_metrics table
    const metricsTable = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'search_performance_metrics' 
      ORDER BY ordinal_position
    `;
    console.log('search_performance_metrics columns:');
    console.log(`Count: ${metricsTable.length}`);
    metricsTable.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    console.log('');

    // Check search_optimization_experiments table
    const experimentsTable = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'search_optimization_experiments' 
      ORDER BY ordinal_position
    `;
    console.log('search_optimization_experiments columns:');
    console.log(`Count: ${experimentsTable.length}`);
    experimentsTable.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    console.log('');

    // Check user_search_preferences table
    const preferencesTable = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_search_preferences' 
      ORDER BY ordinal_position
    `;
    console.log('user_search_preferences columns:');
    console.log(`Count: ${preferencesTable.length}`);
    preferencesTable.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    console.log('');

    // Summary
    console.log('=== SCHEMA VERIFICATION SUMMARY ===');
    console.log(`search_performance_metrics: ${metricsTable.length} columns (expected: 8)`);
    console.log(`search_optimization_experiments: ${experimentsTable.length} columns (expected: 6)`);
    console.log(`user_search_preferences: ${preferencesTable.length} columns (expected: 8)`);

    // Check for discrepancies
    const issues = [];
    if (metricsTable.length !== 8) {
      issues.push(`search_performance_metrics has ${metricsTable.length} columns, expected 8`);
    }
    if (experimentsTable.length !== 6) {
      issues.push(`search_optimization_experiments has ${experimentsTable.length} columns, expected 6`);
    }
    if (preferencesTable.length !== 8) {
      issues.push(`user_search_preferences has ${preferencesTable.length} columns, expected 8`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ All tables have correct column counts!');
    }

  } catch (error) {
    console.error('Error verifying schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
