/**
 * Database Migration Script for Cart Cleanup Audit Table
 * 
 * This script creates the cart_cleanup_audit table for tracking
 * cart cleanup operations.
 * 
 * Run: node create-cleanup-audit-table.js
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating cart_cleanup_audit table...');
    
    // Create the table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS cart_cleanup_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(100) NOT NULL,
        cart_id VARCHAR(255),
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        details JSONB DEFAULT '{}',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating indexes...');
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_cart_cleanup_audit_type ON cart_cleanup_audit(type);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_cart_cleanup_audit_cart_id ON cart_cleanup_audit(cart_id);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_cart_cleanup_audit_user_id ON cart_cleanup_audit(user_id);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_cart_cleanup_audit_timestamp ON cart_cleanup_audit(timestamp);`;
    
    console.log('Cart cleanup audit table created successfully!');
    console.log('Indexes created successfully!');
    
    // Verify the table was created
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'cart_cleanup_audit'
    `;
    
    if (tableCheck.length > 0) {
      console.log('Verification: Table cart_cleanup_audit exists');
    } else {
      console.log('Warning: Table cart_cleanup_audit was not found');
    }
    
  } catch (error) {
    console.error('Error creating cart_cleanup_audit table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
