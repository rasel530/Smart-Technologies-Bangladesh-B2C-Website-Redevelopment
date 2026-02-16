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
    // Check row counts
    const wishlistsCount = await pool.query('SELECT COUNT(*) as count FROM wishlists');
    const wishlistItemsCount = await pool.query('SELECT COUNT(*) as count FROM wishlist_items');
    
    console.log('Existing data:');
    console.log('  wishlists:', wishlistsCount.rows[0].count, 'rows');
    console.log('  wishlist_items:', wishlistItemsCount.rows[0].count, 'rows');
    
    // Check if there are any existing indexes or constraints
    const constraints = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('wishlists', 'wishlist_items')
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    
    console.log('\nExisting constraints:');
    constraints.rows.forEach(c => {
      console.log(`  ${c.table_name}: ${c.constraint_name} (${c.constraint_type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
