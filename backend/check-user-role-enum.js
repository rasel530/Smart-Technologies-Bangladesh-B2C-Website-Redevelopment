const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev'
});

async function checkEnum() {
  try {
    const result = await pool.query(
      `SELECT enumlabel FROM pg_enum WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'UserRole'
      ) ORDER BY enumsortorder;`
    );
    
    console.log('UserRole enum values:');
    result.rows.forEach(row => {
      console.log(`  ${row.enumlabel}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkEnum();
