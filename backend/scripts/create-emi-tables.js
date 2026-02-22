/**
 * Create EMI Tables Migration Script
 * 
 * This script ensures that EMI Provider and EMI Plan tables exist in the database.
 * If they don't exist, it creates them manually.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../services/logger');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkAndCreateTable(tableName, createTableSQL) {
  try {
    // Check if table exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    
    const tableExists = result[0].exists;
    
    if (tableExists) {
      console.log(`✓ Table '${tableName}' already exists`);
      return { exists: true, created: false };
    }
    
    // Create table
    console.log(`Creating table '${tableName}'...`);
    await prisma.$queryRawUnsafe(createTableSQL);
    console.log(`✓ Table '${tableName}' created successfully`);
    return { exists: false, created: true };
  } catch (error) {
    console.error(`✗ Error with table '${tableName}':`, error.message);
    throw error;
  }
}

async function migrate() {
  console.log('========================================');
  console.log('EMI Tables Migration');
  console.log('========================================\n');
  
  try {
    // Create EmiProvider table
    await checkAndCreateTable('emi_providers', `
      CREATE TABLE emi_providers (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        website VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        min_amount DECIMAL(12, 2) NOT NULL DEFAULT 5000,
        max_amount DECIMAL(12, 2) NOT NULL DEFAULT 500000,
        processing_fee DECIMAL(12, 2) DEFAULT 0,
        interest_rate DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create EmiPlan table
    await checkAndCreateTable('emi_plans', `
      CREATE TABLE emi_plans (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        min_amount DECIMAL(12, 2) NOT NULL,
        max_amount DECIMAL(12, 2) NOT NULL,
        processing_fee DECIMAL(12, 2) DEFAULT 0,
        down_payment DECIMAL(12, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_emi_plans_provider_id 
          FOREIGN KEY (provider_id) 
          REFERENCES emi_providers(id) 
          ON DELETE CASCADE
      );
    `);
    
    // Create indexes for emi_providers
    console.log('\nCreating indexes for emi_providers...');
    try {
      await prisma.$queryRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_emi_providers_is_active 
        ON emi_providers(is_active);
      `);
      console.log('✓ Index idx_emi_providers_is_active created');
    } catch (error) {
      console.log('ℹ Index idx_emi_providers_is_active already exists or error:', error.message);
    }
    
    // Create indexes for emi_plans
    console.log('\nCreating indexes for emi_plans...');
    try {
      await prisma.$queryRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_emi_plans_is_active 
        ON emi_plans(is_active);
      `);
      console.log('✓ Index idx_emi_plans_is_active created');
    } catch (error) {
      console.log('ℹ Index idx_emi_plans_is_active already exists or error:', error.message);
    }
    
    try {
      await prisma.$queryRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_emi_plans_provider_id 
        ON emi_plans(provider_id);
      `);
      console.log('✓ Index idx_emi_plans_provider_id created');
    } catch (error) {
      console.log('ℹ Index idx_emi_plans_provider_id already exists or error:', error.message);
    }
    
    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('Migration failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate();
