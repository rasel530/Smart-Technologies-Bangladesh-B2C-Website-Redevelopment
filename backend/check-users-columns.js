const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev'
});

async function checkColumns() {
  try {
    const result = await pool.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
      ['users']
    );
    
    console.log('Users table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
