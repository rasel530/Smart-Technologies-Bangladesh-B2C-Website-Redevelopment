const { Client } = require('pg');

console.log('Testing PostgreSQL connection to localhost:5432...');

async function testPostgres() {
  try {
    const client = new Client({
      connectionString: 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
    });

    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL query result:', result.rows[0]);
    
    await client.end();
    console.log('✅ PostgreSQL disconnected');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testPostgres();