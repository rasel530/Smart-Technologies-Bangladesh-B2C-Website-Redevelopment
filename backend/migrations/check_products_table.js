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
    // Check if products table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'products';
    `);
    
    if (result.rows.length > 0) {
      console.log('products table exists');
      
      // Check structure of products table
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nproducts table structure (first 10 columns):');
      columns.rows.slice(0, 10).forEach(col => {
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
      console.log('products table does NOT exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
