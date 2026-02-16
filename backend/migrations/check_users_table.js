const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users';
    `);
    
    if (result.rows.length > 0) {
      console.log('users table exists');
      
      // Check structure of users table
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nusers table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ' (NOT NULL)'}`);
      });
      
      // Check for id column
      const idColumn = columns.rows.find(c => c.column_name === 'id');
      if (idColumn) {
        console.log(`\n✓ id column found: ${idColumn.data_type}`);
      } else {
        console.log('\n✗ id column NOT found');
      }
    } else {
      console.log('users table does NOT exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
