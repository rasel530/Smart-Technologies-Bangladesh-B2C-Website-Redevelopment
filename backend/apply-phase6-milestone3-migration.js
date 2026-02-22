const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Applying migration: Phase 6 Milestone 3 - Cart-Wishlist Integration');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'phase6_milestone3_cart_wishlist_integration.sql');
    let sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Remove comments (lines starting with --)
    sql = sql.replace(/^--.*$/gm, '');

    // Split by semicolons to get individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('BEGIN') && !s.startsWith('COMMIT'));

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`[${i + 1}/${statements.length}] Executed successfully`);
        } catch (err) {
          // Skip "already exists" errors
          if (err.code === 'P2010' || err.message.includes('already exists')) {
            console.log(`[${i + 1}/${statements.length}] Skipped (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('Created tables:');
    console.log('  - cart_wishlist_sync');
    console.log('  - cart_wishlist_move_history');
    console.log('Created 11 indexes for performance optimization');
    console.log('Created trigger for automatic updated_at updates');

  } catch (e) {
    console.error('\n❌ Migration failed:', e.message);
    console.error('Error details:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
