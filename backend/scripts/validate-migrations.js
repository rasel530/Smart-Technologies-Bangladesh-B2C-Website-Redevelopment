/**
 * Migration Validation Script
 * 
 * This script validates that all migrations are properly applied
 * and database schema matches Prisma schema file.
 * 
 * Usage: node scripts/validate-migrations.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Get expected tables from Prisma schema
 */
function getExpectedTables() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Extract model names from schema
  const modelRegex = /model\s+(\w+)\s*\{/g;
  const models = [];
  let match;
  
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.push(match[1]);
  }
  
  return models;
}

/**
 * Get expected enums from Prisma schema
 */
function getExpectedEnums() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Extract enum names from schema
  const enumRegex = /enum\s+(\w+)\s*\{/g;
  const enums = [];
  let match;
  
  while ((match = enumRegex.exec(schemaContent)) !== null) {
    enums.push(match[1]);
  }
  
  return enums;
}

/**
 * Get mapped table name from model name
 * This extracts @@map directive from schema
 */
function getMappedTableName(modelName) {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Find model definition - use a more robust approach
  // Find the model line first
  const modelLineRegex = new RegExp(`model\\s+${modelName}\\s*\\{`);
  const modelLineMatch = schemaContent.match(modelLineRegex);
  
  if (!modelLineMatch) {
    // Default to lowercase with 's'
    return modelName.toLowerCase() + 's';
  }
  
  // Get the position where the model starts
  const modelStartPos = modelLineMatch.index;
  
  // Find the closing brace for this model
  let braceCount = 0;
  let modelEndPos = modelStartPos;
  const modelDef = schemaContent.substring(modelStartPos);
  
  for (let i = 0; i < modelDef.length; i++) {
    const char = modelDef[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        modelEndPos = modelStartPos + i;
        break;
      }
    }
  }
  
  // Extract the full model definition
  const fullModelDef = schemaContent.substring(modelStartPos, modelEndPos);
  
  // Extract @@map directive - handle both single and double quotes
  const mapRegexSingle = /@@map\s*\(\s*'([^']+)'\s*\)/;
  const mapRegexDouble = /@@map\s*\(\s*"([^"]+)"\s*\)/;
  
  let mapMatch = fullModelDef.match(mapRegexSingle);
  if (!mapMatch) {
    mapMatch = fullModelDef.match(mapRegexDouble);
  }
  
  if (mapMatch) {
    return mapMatch[1];
  }
  
  // Default to lowercase model name with 's' appended (Prisma convention)
  return modelName.toLowerCase() + 's';
}

/**
 * Validate migrations
 */
async function validateMigrations() {
  console.log('=== MIGRATION VALIDATION ===\n');
  
  const issues = [];
  const warnings = [];
  
  try {
    // Get actual database state
    const actualTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const actualTableNames = actualTables.map(row => row.table_name);
    
    const actualEnums = await prisma.$queryRaw`
      SELECT typname 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      GROUP BY typname
      ORDER BY typname
    `;
    
    const actualEnumNames = actualEnums.map(row => row.typname);
    
    // Get expected state from schema
    const expectedTables = getExpectedTables();
    const expectedEnums = getExpectedEnums();
    
    console.log('📊 Schema Comparison:');
    console.log(`  Expected Tables: ${expectedTables.length}`);
    console.log(`  Actual Tables: ${actualTableNames.length}`);
    console.log(`  Expected Enums: ${expectedEnums.length}`);
    console.log(`  Actual Enums: ${actualEnumNames.length}\n`);
    
    // Check for missing tables
    console.log('🔍 Checking for missing tables...');
    const missingTables = [];
    expectedTables.forEach(table => {
      // Prisma uses @@map to map model names to table names
      // We need to check both the model name and the mapped name
      const mappedName = getMappedTableName(table);
      if (!actualTableNames.includes(mappedName)) {
        missingTables.push({ model: table, table: mappedName });
      }
    });
    
    if (missingTables.length > 0) {
      console.log(`  ❌ Found ${missingTables.length} missing tables:`);
      missingTables.forEach(t => {
        console.log(`     - ${t.model} (mapped to: ${t.table})`);
        issues.push(`Missing table: ${t.table} (model: ${t.model})`);
      });
    } else {
      console.log('  ✅ All expected tables are present');
    }
    
    // Check for missing enums
    console.log('\n🔍 Checking for missing enums...');
    const missingEnums = expectedEnums.filter(enumName => !actualEnumNames.includes(enumName));
    
    if (missingEnums.length > 0) {
      console.log(`  ❌ Found ${missingEnums.length} missing enums:`);
      missingEnums.forEach(enumName => {
        console.log(`     - ${enumName}`);
        issues.push(`Missing enum: ${enumName}`);
      });
    } else {
      console.log('  ✅ All expected enums are present');
    }
    
    // Check migration history
    console.log('\n🔍 Checking migration history...');
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count 
      FROM _prisma_migrations 
      ORDER BY started_at DESC
    `;
    
    if (migrations.length === 0) {
      console.log('  ⚠️  No migrations found in database');
      warnings.push('No migrations recorded in _prisma_migrations table');
    } else {
      console.log(`  ✅ Found ${migrations.length} applied migrations`);
      migrations.forEach(m => {
        console.log(`     - ${m.migration_name}`);
      });
    }
    
    // Check for orphaned tables (tables in DB but not in schema)
    console.log('\n🔍 Checking for orphaned tables...');
    const expectedTableNames = expectedTables.map(t => getMappedTableName(t));
    const orphanedTables = actualTableNames.filter(
      table => !expectedTableNames.includes(table) && table !== '_prisma_migrations'
    );
    
    if (orphanedTables.length > 0) {
      console.log(`  ⚠️  Found ${orphanedTables.length} orphaned tables:`);
      orphanedTables.forEach(table => {
        console.log(`     - ${table}`);
        warnings.push(`Orphaned table: ${table}`);
      });
    } else {
      console.log('  ✅ No orphaned tables found');
    }
    
    // Check for orphaned enums
    console.log('\n🔍 Checking for orphaned enums...');
    const orphanedEnums = actualEnumNames.filter(enumName => !expectedEnums.includes(enumName));
    
    if (orphanedEnums.length > 0) {
      console.log(`  ⚠️  Found ${orphanedEnums.length} orphaned enums:`);
      orphanedEnums.forEach(enumName => {
        console.log(`     - ${enumName}`);
        warnings.push(`Orphaned enum: ${enumName}`);
      });
    } else {
      console.log('  ✅ No orphaned enums found');
    }
    
    // Test basic database operations
    console.log('\n🔍 Testing basic database operations...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('  ✅ Database query successful');
    } catch (error) {
      console.log(`  ❌ Database query failed: ${error.message}`);
      issues.push(`Database query failed: ${error.message}`);
    }
    
    try {
      await prisma.user.findFirst();
      console.log('  ✅ Prisma Client query successful');
    } catch (error) {
      console.log(`  ❌ Prisma Client query failed: ${error.message}`);
      issues.push(`Prisma Client query failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ ALL CHECKS PASSED - Database is in sync with schema');
      return { success: true, issues: [], warnings: [] };
    } else {
      if (issues.length > 0) {
        console.log(`\n❌ ISSUES (${issues.length}):`);
        issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
        warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      console.log('\nRecommendations:');
      if (issues.length > 0) {
        console.log('  1. Run: node scripts/comprehensive-migration-solution.js');
        console.log('  2. This will apply pending migrations and fix schema issues');
      }
      if (warnings.length > 0) {
        console.log('  3. Review orphaned tables/enums - they may need cleanup');
      }
      
      return { success: issues.length === 0, issues, warnings };
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    return { success: false, issues: [error.message], warnings: [] };
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation if called directly
if (require.main === module) {
  validateMigrations()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateMigrations, getExpectedTables, getExpectedEnums };
