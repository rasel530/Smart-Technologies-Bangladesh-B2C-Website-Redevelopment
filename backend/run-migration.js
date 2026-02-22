const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting Cart Recovery Settings migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'prisma/migrations/add_cart_recovery_settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        // Ignore errors for IF NOT EXISTS statements
        if (error.message.includes('already exists')) {
          console.log(`⊘ Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`✗ Statement ${i + 1}/${statements.length} failed:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✓ Migration completed successfully!');
    console.log('The cart_recovery_settings table has been created with default settings.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
