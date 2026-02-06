/**
 * Database Schema Verification Script for Search Analytics Tables
 * 
 * This script verifies the actual database schema for:
 * 1. search_performance_metrics (expected: 8 columns)
 * 2. search_optimization_experiments (expected: 9 columns)
 * 3. user_search_preferences (expected: 7 columns)
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifySearchTablesSchema() {
  const prisma = new PrismaClient();
  
  console.log('='.repeat(80));
  console.log('DATABASE SCHEMA VERIFICATION FOR SEARCH ANALYTICS TABLES');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING'}`);
  console.log('='.repeat(80));
  console.log();

  try {
    // Connect to database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Define expected schemas
    const expectedSchemas = {
      search_performance_metrics: {
        expectedCount: 8,
        columns: [
          { name: 'id', type: 'text', nullable: false, key: 'PRIMARY KEY' },
          { name: 'timestamp', type: 'timestamp without time zone', nullable: true, key: '' },
          { name: 'queryCount', type: 'integer', nullable: true, key: '' },
          { name: 'avgResponseTime', type: 'integer', nullable: true, key: '' },
          { name: 'p95ResponseTime', type: 'integer', nullable: true, key: '' },
          { name: 'p99ResponseTime', type: 'integer', nullable: true, key: '' },
          { name: 'cacheHitRate', type: 'double precision', nullable: true, key: '' },
          { name: 'zeroResultQueries', type: 'integer', nullable: true, key: '' }
        ],
        forbiddenColumns: ['totalQueries']
      },
      search_optimization_experiments: {
        expectedCount: 9,
        columns: [
          { name: 'id', type: 'text', nullable: false, key: 'PRIMARY KEY' },
          { name: 'name', type: 'text', nullable: false, key: '' },
          { name: 'description', type: 'text', nullable: true, key: '' },
          { name: 'algorithmVariant', type: 'text', nullable: false, key: '' },
          { name: 'startDate', type: 'timestamp without time zone', nullable: false, key: '' },
          { name: 'endDate', type: 'timestamp without time zone', nullable: true, key: '' },
          { name: 'isActive', type: 'boolean', nullable: true, key: '' },
          { name: 'metrics', type: 'jsonb', nullable: true, key: '' },
          { name: 'sampleSize', type: 'integer', nullable: true, key: '' }
        ],
        forbiddenColumns: []
      },
      user_search_preferences: {
        expectedCount: 7,
        columns: [
          { name: 'id', type: 'text', nullable: false, key: 'PRIMARY KEY' },
          { name: 'userId', type: 'text', nullable: false, key: 'UNIQUE' },
          { name: 'preferredCategories', type: 'jsonb', nullable: true, key: '' },
          { name: 'preferredBrands', type: 'jsonb', nullable: true, key: '' },
          { name: 'priceRangeMin', type: 'integer', nullable: true, key: '' },
          { name: 'priceRangeMax', type: 'integer', nullable: true, key: '' },
          { name: 'searchHistory', type: 'jsonb', nullable: true, key: '' }
        ],
        forbiddenColumns: ['lastUpdated']
      }
    };

    const results = {};
    const allIssues = [];

    // Verify each table
    for (const [tableName, expectedSchema] of Object.entries(expectedSchemas)) {
      console.log('='.repeat(80));
      console.log(`VERIFYING TABLE: ${tableName}`);
      console.log('='.repeat(80));

      try {
        // Query actual schema from PostgreSQL information schema
        const schemaQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `;

        const actualColumns = await prisma.$queryRawUnsafe(schemaQuery);
        
        // Query primary key and unique constraints
        const constraintsQuery = `
          SELECT
            kcu.column_name,
            tc.constraint_type
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name = '${tableName}'
          ORDER BY tc.constraint_type, kcu.column_name;
        `;

        const constraints = await prisma.$queryRawUnsafe(constraintsQuery);

        // Build constraint lookup
        const constraintMap = {};
        for (const constraint of constraints) {
          constraintMap[constraint.column_name] = constraint.constraint_type;
        }

        console.log(`\nActual column count: ${actualColumns.length}`);
        console.log(`Expected column count: ${expectedSchema.expectedCount}`);

        // Display actual columns
        console.log('\nACTUAL COLUMNS:');
        console.log('-'.repeat(80));
        console.log(sprintf('%-30s %-30s %-10s %-15s', 'Column Name', 'Data Type', 'Nullable', 'Constraint'));
        console.log('-'.repeat(80));
        
        for (const col of actualColumns) {
          const constraint = constraintMap[col.column_name] || '';
          console.log(sprintf('%-30s %-30s %-10s %-15s', 
            col.column_name,
            col.data_type,
            col.is_nullable,
            constraint
          ));
        }

        // Verification checks
        const tableResult = {
          tableName,
          actualCount: actualColumns.length,
          expectedCount: expectedSchema.expectedCount,
          countMatch: actualColumns.length === expectedSchema.expectedCount,
          columns: [],
          issues: []
        };

        // Check for forbidden columns
        for (const forbiddenCol of expectedSchema.forbiddenColumns) {
          const hasForbidden = actualColumns.some(col => 
            col.column_name.toLowerCase() === forbiddenCol.toLowerCase()
          );
          if (hasForbidden) {
            tableResult.issues.push(`❌ FORBIDDEN COLUMN FOUND: ${forbiddenCol} should NOT exist`);
            allIssues.push(`[${tableName}] Forbidden column found: ${forbiddenCol}`);
          } else {
            console.log(`\n✅ Forbidden column check: ${forbiddenCol} does NOT exist (as expected)`);
          }
        }

        // Verify each expected column exists
        console.log('\nCOLUMN VERIFICATION:');
        console.log('-'.repeat(80));
        
        for (const expectedCol of expectedSchema.columns) {
          const actualCol = actualColumns.find(col => 
            col.column_name.toLowerCase() === expectedCol.name.toLowerCase()
          );

          if (actualCol) {
            // Column exists, check type
            const typeMatch = checkTypeMatch(actualCol.data_type, expectedCol.type);
            const nullableMatch = expectedCol.nullable ? 
              actualCol.is_nullable === 'YES' : 
              actualCol.is_nullable === 'NO';

            const colStatus = {
              name: expectedCol.name,
              exists: true,
              typeMatch,
              nullableMatch,
              actualType: actualCol.data_type,
              expectedType: expectedCol.type,
              actualNullable: actualCol.is_nullable,
              expectedNullable: expectedCol.nullable ? 'YES' : 'NO'
            };

            if (typeMatch && nullableMatch) {
              console.log(`✅ ${expectedCol.name}: Type=${actualCol.data_type}, Nullable=${actualCol.is_nullable}`);
            } else {
              if (!typeMatch) {
                colStatus.issues.push(`Type mismatch: expected ${expectedCol.type}, got ${actualCol.data_type}`);
                tableResult.issues.push(`❌ ${expectedCol.name}: Type mismatch (expected ${expectedCol.type}, got ${actualCol.data_type})`);
                allIssues.push(`[${tableName}] ${expectedCol.name}: Type mismatch (expected ${expectedCol.type}, got ${actualCol.data_type})`);
              }
              if (!nullableMatch) {
                colStatus.issues.push(`Nullable mismatch: expected ${expectedCol.nullable ? 'YES' : 'NO'}, got ${actualCol.is_nullable}`);
                tableResult.issues.push(`❌ ${expectedCol.name}: Nullable mismatch (expected ${expectedCol.nullable ? 'YES' : 'NO'}, got ${actualCol.is_nullable})`);
                allIssues.push(`[${tableName}] ${expectedCol.name}: Nullable mismatch (expected ${expectedCol.nullable ? 'YES' : 'NO'}, got ${actualCol.is_nullable})`);
              }
              console.log(`❌ ${expectedCol.name}: ${colStatus.issues.join(', ')}`);
            }

            tableResult.columns.push(colStatus);
          } else {
            // Column is missing
            tableResult.columns.push({
              name: expectedCol.name,
              exists: false,
              issues: ['Column is missing']
            });
            tableResult.issues.push(`❌ ${expectedCol.name}: Column is missing`);
            allIssues.push(`[${tableName}] ${expectedCol.name}: Column is missing`);
            console.log(`❌ ${expectedCol.name}: Column is MISSING`);
          }
        }

        // Check for unexpected columns
        const expectedColumnNames = expectedSchema.columns.map(c => c.name.toLowerCase());
        const unexpectedColumns = actualColumns.filter(col => 
          !expectedColumnNames.includes(col.column_name.toLowerCase())
        );

        if (unexpectedColumns.length > 0) {
          console.log('\n⚠️  UNEXPECTED COLUMNS FOUND:');
          for (const col of unexpectedColumns) {
            console.log(`   - ${col.column_name} (${col.data_type})`);
            tableResult.issues.push(`⚠️  Unexpected column: ${col.column_name}`);
            allIssues.push(`[${tableName}] Unexpected column: ${col.column_name} (${col.data_type})`);
          }
        } else {
          console.log('\n✅ No unexpected columns found');
        }

        // Summary for this table
        console.log('\n' + '-'.repeat(80));
        console.log(`TABLE SUMMARY: ${tableName}`);
        console.log('-'.repeat(80));
        console.log(`Column count: ${tableResult.countMatch ? '✅ MATCH' : '❌ MISMATCH'} (${tableResult.actualCount}/${tableResult.expectedCount})`);
        console.log(`Forbidden columns: ${tableResult.issues.filter(i => i.includes('FORBIDDEN')).length === 0 ? '✅ NONE' : '❌ FOUND'}`);
        console.log(`Missing columns: ${tableResult.columns.filter(c => !c.exists).length === 0 ? '✅ NONE' : '❌ FOUND'}`);
        console.log(`Type mismatches: ${tableResult.columns.filter(c => c.issues && c.issues.some(i => i.includes('Type'))).length === 0 ? '✅ NONE' : '❌ FOUND'}`);
        console.log(`Nullable mismatches: ${tableResult.columns.filter(c => c.issues && c.issues.some(i => i.includes('Nullable'))).length === 0 ? '✅ NONE' : '❌ FOUND'}`);
        console.log(`Unexpected columns: ${unexpectedColumns.length === 0 ? '✅ NONE' : '❌ FOUND'}`);
        
        const allIssuesResolved = tableResult.issues.length === 0;
        console.log(`\nOverall status: ${allIssuesResolved ? '✅ ALL CHECKS PASSED' : '❌ ISSUES FOUND'}`);
        console.log();

        results[tableName] = tableResult;

      } catch (error) {
        console.error(`❌ Error verifying table ${tableName}:`, error.message);
        results[tableName] = {
          tableName,
          error: error.message,
          success: false
        };
        allIssues.push(`[${tableName}] Query error: ${error.message}`);
      }
    }

    // Overall summary
    console.log('='.repeat(80));
    console.log('OVERALL VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    let totalTables = Object.keys(expectedSchemas).length;
    let passedTables = 0;
    let failedTables = 0;

    for (const [tableName, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`❌ ${tableName}: ERROR - ${result.error}`);
        failedTables++;
      } else if (result.issues && result.issues.length === 0) {
        console.log(`✅ ${tableName}: ALL CHECKS PASSED`);
        passedTables++;
      } else {
        console.log(`❌ ${tableName}: ${result.issues.length} ISSUE(S) FOUND`);
        failedTables++;
      }
    }

    console.log();
    console.log(`Total tables: ${totalTables}`);
    console.log(`Passed: ${passedTables}`);
    console.log(`Failed: ${failedTables}`);
    console.log();

    if (allIssues.length > 0) {
      console.log('='.repeat(80));
      console.log('ALL ISSUES FOUND:');
      console.log('='.repeat(80));
      for (const issue of allIssues) {
        console.log(`  ${issue}`);
      }
      console.log();
    }

    // Service code alignment check
    console.log('='.repeat(80));
    console.log('SERVICE CODE ALIGNMENT CHECK');
    console.log('='.repeat(80));
    
    const serviceFiles = [
      'backend/services/searchPerformance.service.js',
      'backend/services/searchOptimization.service.js',
      'backend/services/searchPersonalization.service.js'
    ];

    console.log('\nService files to verify:');
    for (const file of serviceFiles) {
      console.log(`  - ${file}`);
    }
    console.log('\n⚠️  Note: Manual verification required to ensure service code only references existing columns');
    console.log('   The service files should be checked to confirm they do not reference:');
    console.log('   - totalQueries in search_performance_metrics');
    console.log('   - lastUpdated in user_search_preferences');
    console.log();

    // Final verdict
    console.log('='.repeat(80));
    console.log('FINAL VERDICT');
    console.log('='.repeat(80));
    
    const allPassed = passedTables === totalTables && allIssues.length === 0;
    
    if (allPassed) {
      console.log('✅ ALL VERIFICATION CHECKS PASSED');
      console.log('\nThe database schema is correctly aligned with the expected schema.');
      console.log('Service code should work correctly with the current database structure.');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log('\nIssues were found that need to be addressed before service code can work correctly.');
      console.log('Please review the issues listed above and fix the schema or service code accordingly.');
    }
    
    console.log('='.repeat(80));
    console.log();

    return {
      success: allPassed,
      totalTables,
      passedTables,
      failedTables,
      results,
      allIssues
    };

  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Helper function to check type match
function checkTypeMatch(actualType, expectedType) {
  const normalizedActual = actualType.toLowerCase().replace(/\s+/g, ' ');
  const normalizedExpected = expectedType.toLowerCase().replace(/\s+/g, ' ');
  
  // Handle type variations
  const typeMappings = {
    'text': ['text', 'character varying', 'varchar'],
    'integer': ['integer', 'int', 'int4'],
    'double precision': ['double precision', 'float8'],
    'timestamp without time zone': ['timestamp without time zone', 'timestamp'],
    'jsonb': ['jsonb'],
    'boolean': ['boolean', 'bool']
  };

  for (const [base, variations] of Object.entries(typeMappings)) {
    if (variations.includes(normalizedExpected) && variations.includes(normalizedActual)) {
      return true;
    }
  }

  return normalizedActual === normalizedExpected;
}

// Simple sprintf implementation
function sprintf(format, ...args) {
  return format.replace(/%-?\d*s/g, (match) => {
    const width = parseInt(match.substring(1, match.length - 1));
    const arg = args.shift();
    const str = String(arg);
    if (match.startsWith('%-')) {
      return str.padEnd(width);
    } else {
      return str.padStart(width);
    }
  });
}

// Run verification
if (require.main === module) {
  verifySearchTablesSchema()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySearchTablesSchema };
