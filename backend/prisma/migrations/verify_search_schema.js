#!/usr/bin/env node

/**
 * ============================================================================
 * Database Verification Script for search_logs Table
 * Phase 5 Milestone 2 - Search Functionality
 * ============================================================================
 * Purpose: Verify search_logs table structure, indexes, and test basic CRUD operations
 * 
 * Usage: node verify_search_schema.js
 * 
 * This script will:
 * 1. Verify search_logs table exists and has correct structure
 * 2. Verify all required indexes exist
 * 3. Verify foreign key constraints
 * 4. Test basic CRUD operations
 * 5. Output verification results to console
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function for colored console output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

// Required columns for search_logs table
const REQUIRED_COLUMNS = [
  { name: 'id', type: 'uuid', nullable: false },
  { name: 'query', type: 'character varying', nullable: false },
  { name: 'user_id', type: 'character varying', nullable: true },
  { name: 'results_count', type: 'integer', nullable: true },
  { name: 'execution_time', type: 'double precision', nullable: true },
  { name: 'filters', type: 'jsonb', nullable: true },
  { name: 'ip_address', type: 'character varying', nullable: true },
  { name: 'user_agent', type: 'character varying', nullable: true },
  { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
];

// Required indexes for search_logs table
const REQUIRED_INDEXES = [
  'idx_search_logs_user_id',
  'idx_search_logs_timestamp',
  'idx_search_logs_query',
  // Optimization indexes
  'idx_search_logs_user_timestamp',
  'idx_search_logs_query_timestamp',
  'idx_search_logs_execution_time',
  'idx_search_logs_results_count',
  'idx_search_logs_timestamp_user',
  'idx_search_logs_filters',
  'idx_search_logs_ip_timestamp',
  'idx_search_logs_user_agent_timestamp',
  'idx_search_logs_user_query_timestamp',
  'idx_search_logs_user_execution',
];

// Required constraints
const REQUIRED_CONSTRAINTS = [
  'search_logs_pkey', // Primary key
  'fk_search_logs_user', // Foreign key to users
];

async function verifyTableStructure(prisma) {
  logSection('Verifying search_logs Table Structure');

  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'search_logs'
      ) as exists
    `;

    if (tableExists[0].exists) {
      logSuccess('Table search_logs exists');
    } else {
      logError('Table search_logs does NOT exist');
      return false;
    }

    // Verify columns
    logInfo('Verifying columns...');
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'search_logs'
      ORDER BY ordinal_position
    `;

    const columnMap = new Map(columns.map(col => [col.column_name, col]));
    let allColumnsPresent = true;

    for (const required of REQUIRED_COLUMNS) {
      const column = columnMap.get(required.name);
      if (column) {
        const typeMatches = column.data_type.includes(required.type.split('(')[0]);
        const nullableMatches = column.is_nullable === (required.nullable ? 'YES' : 'NO');
        
        if (typeMatches && nullableMatches) {
          logSuccess(`Column ${required.name} exists with correct type (${column.data_type})`);
        } else {
          logWarning(`Column ${required.name} exists but type/nullable mismatch: ${column.data_type}, nullable: ${column.is_nullable}`);
          allColumnsPresent = false;
        }
      } else {
        logError(`Column ${required.name} is missing`);
        allColumnsPresent = false;
      }
    }

    // Log all columns found
    logInfo(`Total columns found: ${columns.length}`);
    columns.forEach(col => {
      logInfo(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    return allColumnsPresent;
  } catch (error) {
    logError(`Error verifying table structure: ${error.message}`);
    return false;
  }
}

async function verifyIndexes(prisma) {
  logSection('Verifying search_logs Indexes');

  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'search_logs'
      ORDER BY indexname
    `;

    const indexSet = new Set(indexes.map(idx => idx.indexname));
    let allIndexesPresent = true;

    for (const requiredIndex of REQUIRED_INDEXES) {
      if (indexSet.has(requiredIndex)) {
        const indexDef = indexes.find(idx => idx.indexname === requiredIndex);
        logSuccess(`Index ${requiredIndex} exists`);
      } else {
        logWarning(`Index ${requiredIndex} is missing (will be created by optimization script)`);
        allIndexesPresent = false;
      }
    }

    // Log all indexes found
    logInfo(`Total indexes found: ${indexes.length}`);
    indexes.forEach(idx => {
      logInfo(`  - ${idx.indexname}`);
    });

    return allIndexesPresent;
  } catch (error) {
    logError(`Error verifying indexes: ${error.message}`);
    return false;
  }
}

async function verifyConstraints(prisma) {
  logSection('Verifying search_logs Constraints');

  try {
    const constraints = await prisma.$queryRaw`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'search_logs'
      ORDER BY constraint_name
    `;

    const constraintSet = new Set(constraints.map(c => c.constraint_name));
    let allConstraintsPresent = true;

    for (const requiredConstraint of REQUIRED_CONSTRAINTS) {
      if (constraintSet.has(requiredConstraint)) {
        const constraint = constraints.find(c => c.constraint_name === requiredConstraint);
        logSuccess(`Constraint ${requiredConstraint} exists (${constraint.constraint_type})`);
      } else {
        logWarning(`Constraint ${requiredConstraint} is missing`);
        allConstraintsPresent = false;
      }
    }

    // Log all constraints found
    logInfo(`Total constraints found: ${constraints.length}`);
    constraints.forEach(constraint => {
      logInfo(`  - ${constraint.constraint_name} (${constraint.constraint_type})`);
    });

    return allConstraintsPresent;
  } catch (error) {
    logError(`Error verifying constraints: ${error.message}`);
    return false;
  }
}

async function testCRUDOperations(prisma) {
  logSection('Testing CRUD Operations');

  let testUserId = null;
  let testSearchLogId = null;

  try {
    // Get a test user (or create one if needed)
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (testUser) {
      testUserId = testUser.id;
      logInfo(`Using existing test user: ${testUser.id}`);
    } else {
      logWarning('No test user found, using NULL user_id for tests');
    }

    // Test CREATE
    logInfo('Testing CREATE operation...');
    const newSearchLog = await prisma.searchLog.create({
      data: {
        query: 'test search query',
        userId: testUserId,
        resultsCount: 10,
        executionTime: 45.5,
        filters: { category: 'electronics', priceRange: '100-500' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    testSearchLogId = newSearchLog.id;
    logSuccess(`Created search log with ID: ${newSearchLog.id}`);

    // Test READ
    logInfo('Testing READ operation...');
    const foundSearchLog = await prisma.searchLog.findUnique({
      where: { id: testSearchLogId }
    });

    if (foundSearchLog) {
      logSuccess(`Found search log: ${foundSearchLog.query}`);
      logInfo(`  - Results count: ${foundSearchLog.resultsCount}`);
      logInfo(`  - Execution time: ${foundSearchLog.executionTime}ms`);
      logInfo(`  - Filters: ${JSON.stringify(foundSearchLog.filters)}`);
    } else {
      logError('Failed to find created search log');
      return false;
    }

    // Test UPDATE
    logInfo('Testing UPDATE operation...');
    const updatedSearchLog = await prisma.searchLog.update({
      where: { id: testSearchLogId },
      data: {
        resultsCount: 20,
        executionTime: 50.0
      }
    });

    if (updatedSearchLog.resultsCount === 20 && updatedSearchLog.executionTime === 50.0) {
      logSuccess('Updated search log successfully');
    } else {
      logError('Failed to update search log');
      return false;
    }

    // Test DELETE
    logInfo('Testing DELETE operation...');
    await prisma.searchLog.delete({
      where: { id: testSearchLogId }
    });

    const deletedSearchLog = await prisma.searchLog.findUnique({
      where: { id: testSearchLogId }
    });

    if (!deletedSearchLog) {
      logSuccess('Deleted search log successfully');
    } else {
      logError('Failed to delete search log');
      return false;
    }

    // Test query with filters
    logInfo('Testing query with JSONB filters...');
    const searchWithFilters = await prisma.searchLog.create({
      data: {
        query: 'laptop',
        userId: testUserId,
        resultsCount: 15,
        executionTime: 35.2,
        filters: { brand: 'Dell', priceRange: '500-1000', inStock: true }
      }
    });

    const filterTestSearchLogId = searchWithFilters.id;

    // Cleanup test data
    await prisma.searchLog.delete({
      where: { id: filterTestSearchLogId }
    });

    logSuccess('JSONB filters test completed');

    return true;
  } catch (error) {
    logError(`Error during CRUD test: ${error.message}`);
    
    // Cleanup on error
    if (testSearchLogId) {
      try {
        await prisma.searchLog.delete({ where: { id: testSearchLogId } });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    return false;
  }
}

async function verifyStatistics(prisma) {
  logSection('Search Logs Statistics');

  try {
    const stats = await prisma.searchLog.aggregate({
      _count: { id: true },
      _avg: { executionTime: true, resultsCount: true },
      _max: { timestamp: true },
      _min: { timestamp: true }
    });

    logInfo(`Total search logs: ${stats._count.id}`);
    logInfo(`Average execution time: ${stats._avg.executionTime?.toFixed(2) || 'N/A'}ms`);
    logInfo(`Average results count: ${stats._avg.resultsCount?.toFixed(2) || 'N/A'}`);
    logInfo(`Earliest search: ${stats._min.timestamp || 'N/A'}`);
    logInfo(`Latest search: ${stats._max.timestamp || 'N/A'}`);

    // Get top queries
    const topQueries = await prisma.$queryRaw`
      SELECT 
        query,
        COUNT(*) as count
      FROM search_logs
      GROUP BY query
      ORDER BY count DESC
      LIMIT 5
    `;

    if (topQueries.length > 0) {
      logInfo('\nTop 5 search queries:');
      topQueries.forEach((q, index) => {
        logInfo(`  ${index + 1}. "${q.query}" (${q.count} searches)`);
      });
    }

    return true;
  } catch (error) {
    logError(`Error fetching statistics: ${error.message}`);
    return false;
  }
}

async function main() {
  logSection('Phase 5 Milestone 2 - Search Schema Verification');
  logInfo('Starting verification process...\n');

  const prisma = new PrismaClient();

  try {
    // Run all verifications
    const structureOk = await verifyTableStructure(prisma);
    const indexesOk = await verifyIndexes(prisma);
    const constraintsOk = await verifyConstraints(prisma);
    const crudOk = await testCRUDOperations(prisma);
    const statsOk = await verifyStatistics(prisma);

    // Final summary
    logSection('Verification Summary');
    
    const allPassed = structureOk && indexesOk && constraintsOk && crudOk && statsOk;

    if (allPassed) {
      logSuccess('All verifications passed successfully!');
      logInfo('The search_logs table is properly configured for Phase 5 Milestone 2');
    } else {
      logWarning('Some verifications failed or have warnings');
      
      if (!structureOk) logError('Table structure verification failed');
      if (!indexesOk) logError('Index verification failed (run optimize_search_logs.sql)');
      if (!constraintsOk) logError('Constraint verification failed');
      if (!crudOk) logError('CRUD operations test failed');
      if (!statsOk) logError('Statistics verification failed');
    }

    logSection('Next Steps');
    
    if (!indexesOk) {
      logInfo('1. Run the optimization script: psql -d your_database -f optimize_search_logs.sql');
    }
    
    if (allPassed) {
      logInfo('1. The search schema is ready for production use');
      logInfo('2. You can now implement search analytics and monitoring features');
      logInfo('3. Consider setting up periodic maintenance tasks for index optimization');
    }

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
    logSection('Verification Complete');
    process.exit(0);
  }
}

// Run the verification
main();
